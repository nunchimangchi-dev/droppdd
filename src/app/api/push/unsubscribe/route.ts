import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePushSession } from "@/lib/push-api";

const unsubscribeSchema = z.object({ endpoint: z.string().min(1).max(2048) });

export async function POST(request: NextRequest) {
  const gate = await requirePushSession(request);
  if ("error" in gate) return gate.error;

  const parsed = unsubscribeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Scoped to the session user so one user cannot remove another's device.
  await prisma.pushSubscription.deleteMany({
    where: { endpoint: parsed.data.endpoint, userId: gate.userId },
  });

  return NextResponse.json({ ok: true });
}
