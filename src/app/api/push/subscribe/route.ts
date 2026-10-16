import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePushSession } from "@/lib/push-api";
import { isAllowedPushEndpoint } from "@/lib/push-endpoint";

// Cap devices per user so one account cannot fan the sender out without bound.
const MAX_SUBSCRIPTIONS_PER_USER = 10;

const subscribeSchema = z.object({
  endpoint: z
    .string()
    .max(2048)
    .refine(isAllowedPushEndpoint, "endpoint must be a known push service"),
  keys: z.object({
    p256dh: z.string().min(1).max(256),
    auth: z.string().min(1).max(256),
  }),
});

export async function POST(request: NextRequest) {
  const gate = await requirePushSession(request);
  if ("error" in gate) return gate.error;

  const parsed = subscribeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }
  const { endpoint, keys } = parsed.data;
  const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? null;

  const existing = await prisma.pushSubscription.findUnique({
    where: { endpoint },
    select: { id: true },
  });
  if (!existing) {
    const count = await prisma.pushSubscription.count({ where: { userId: gate.userId } });
    if (count >= MAX_SUBSCRIPTIONS_PER_USER) {
      return NextResponse.json({ error: "Too many devices" }, { status: 409 });
    }
  }

  // Upsert by endpoint: re-subscribing the same browser re-attaches it to
  // whoever is signed in now and clears any failure history.
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: gate.userId, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent },
    update: { userId: gate.userId, p256dh: keys.p256dh, auth: keys.auth, userAgent, failureCount: 0 },
  });

  return NextResponse.json({ ok: true });
}
