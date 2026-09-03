"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyTurnstile } from "@/lib/turnstile";
import { SELF_REQUEST_HOURLY_CAP } from "@/lib/invite-limit";

const schema = z.object({
  email: z.string().trim().toLowerCase().email(),
  note: z.string().trim().max(280).optional(),
});

// Public, unauthenticated. Defense in layers: hidden honeypot field ->
// Zod -> Cloudflare Turnstile -> dedupe (no account enumeration) ->
// rolling-hour cap. No email is sent from here; the row surfaces on
// /admin for the maintainer to provision + reach out manually.
export async function requestAccess(formData: FormData) {
  // 1. Honeypot: a field positioned off-screen that humans never fill.
  //    Pretend success so a bot learns nothing.
  if (((formData.get("company") as string) ?? "").trim() !== "") {
    redirect("/request-access?sent=1");
  }

  // 2. Shape validation.
  const parsed = schema.safeParse({
    email: formData.get("email"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    redirect("/request-access?error=invalid");
  }
  const { email, note } = parsed.data;

  // 3. Turnstile — canonical server-side siteverify, fails closed.
  const hdrs = await headers();
  const clientIp =
    hdrs.get("cf-connecting-ip") ??
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null;
  const passed = await verifyTurnstile(
    formData.get("cf-turnstile-response"),
    clientIp,
    "request_access",
  );
  if (!passed) {
    redirect("/request-access?error=challenge");
  }

  // 4. Dedupe. Already allowlisted, or already asked -> silent success.
  //    Same response for both so the form can't be used to probe who's in.
  const [alreadyAllowed, alreadyRequested] = await Promise.all([
    prisma.allowedEmail.findUnique({ where: { email } }),
    prisma.inviteRequest.findFirst({ where: { email } }),
  ]);
  if (alreadyAllowed || alreadyRequested) {
    redirect("/request-access?sent=1");
  }

  // 5. Rolling-hour backstop cap.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.inviteRequest.count({
    where: { source: "self_request", createdAt: { gte: oneHourAgo } },
  });
  if (recentCount >= SELF_REQUEST_HOURLY_CAP) {
    redirect("/request-access?error=busy");
  }

  await prisma.inviteRequest.create({
    data: { email, note, source: "self_request" },
  });

  redirect("/request-access?sent=1");
}
