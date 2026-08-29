"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { impliedWeeklyRatePercent } from "@/lib/wagers";
import { findUserByUsername } from "@/lib/username";

// Server-side validation for wager creation - the form's <select> and
// input constraints only enforce this client-side, which is trivially
// bypassed by anyone posting to the action directly.
const createWagerSchema = z.object({
  title: z.string().trim().min(1).max(200),
  metric: z.enum(["WEIGHT_TARGET", "STREAK_TARGET"]),
  targetValue: z.coerce.number().finite(),
  stakeDescription: z.string().trim().min(1).max(500),
  endDate: z.coerce.date(),
  challengeUsername: z.string().trim().optional(),
});

// Echoes the submitted values back onto the redirect so the form doesn't
// wipe itself on a validation error - read as defaultValue on the page.
function buildEchoParams(formData: FormData, error: string): string {
  const params = new URLSearchParams({ error });
  for (const key of ["title", "metric", "targetValue", "stakeDescription", "endDate", "challengeUsername"]) {
    const v = formData.get(key);
    if (typeof v === "string" && v.length > 0) params.set(key, v);
  }
  return params.toString();
}

export async function createWager(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const userId = session.user.id;

  const parsed = createWagerSchema.safeParse({
    title: formData.get("title"),
    metric: formData.get("metric"),
    targetValue: formData.get("targetValue"),
    stakeDescription: formData.get("stakeDescription"),
    endDate: formData.get("endDate"),
    challengeUsername: formData.get("challengeUsername") || undefined,
  });

  if (!parsed.success) {
    redirect(`/wagers?${buildEchoParams(formData, "missing-fields")}`);
  }

  const { title, metric, targetValue, stakeDescription, endDate, challengeUsername } = parsed.data;
  const now = new Date();

  if (endDate <= now) {
    redirect(`/wagers?${buildEchoParams(formData, "invalid-date")}`);
  }

  // Peer challenge path: no startValue yet (captured at accept-time from
  // the challenged user's own progress), status PENDING. The creator
  // doesn't need their own Progress row for this - they're not the one
  // being measured.
  if (challengeUsername && challengeUsername.length > 0) {
    const targetUser = await findUserByUsername(challengeUsername);
    if (!targetUser) {
      redirect(`/wagers?${buildEchoParams(formData, "user-not-found")}`);
    }
    if (targetUser.id === userId) {
      redirect(`/wagers?${buildEchoParams(formData, "self-challenge")}`);
    }

    await prisma.wager.create({
      data: {
        userId,
        challengedUserId: targetUser.id,
        title,
        metric,
        targetValue,
        stakeDescription,
        endDate,
        status: "PENDING",
      },
    });

    redirect("/wagers");
  }

  // Solo path - unchanged from before peer challenges existed.
  const progress = await prisma.progress.findFirst({ where: { userId } });
  if (!progress) {
    redirect(`/wagers?${buildEchoParams(formData, "no-progress")}`);
  }

  const startValue =
    metric === "WEIGHT_TARGET" ? progress.currentWeight : progress.currentStreak;

  if (metric === "WEIGHT_TARGET" && targetValue < startValue) {
    const rate = impliedWeeklyRatePercent(startValue, targetValue, now, endDate);
    if (rate > 1) {
      redirect(`/wagers?${buildEchoParams(formData, "too-aggressive")}`);
    }
  }

  await prisma.wager.create({
    data: {
      userId,
      title,
      metric,
      startValue,
      targetValue,
      stakeDescription,
      endDate,
    },
  });

  redirect("/wagers");
}

export async function respondToChallenge(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const userId = session.user.id;

  const wagerId = Number(formData.get("wagerId"));
  const action = formData.get("action");

  const wager = await prisma.wager.findUnique({ where: { id: wagerId } });
  if (!wager || wager.challengedUserId !== userId || wager.status !== "PENDING") {
    redirect("/wagers?error=invalid-challenge");
  }

  if (action === "reject") {
    await prisma.wager.update({
      where: { id: wagerId },
      data: { status: "REJECTED", resolvedAt: new Date() },
    });
    redirect("/wagers");
  }

  if (action === "accept") {
    const progress = await prisma.progress.findFirst({ where: { userId } });
    if (!progress) {
      redirect(`/wagers/respond/${wagerId}?error=no-progress`);
    }

    const startValue =
      wager.metric === "WEIGHT_TARGET" ? progress.currentWeight : progress.currentStreak;

    // Same goal-aggressiveness guardrail as solo creation, applied here
    // instead of at challenge-creation time - the baseline (and therefore
    // the implied pace) is only knowable once the challenged user's own
    // progress is on the table. Redirects back to the review page (not
    // the general /wagers list) so the rejection reason stays in context
    // instead of dumping the user back to a generic error banner.
    if (wager.metric === "WEIGHT_TARGET" && wager.targetValue < startValue) {
      const rate = impliedWeeklyRatePercent(startValue, wager.targetValue, new Date(), wager.endDate);
      if (rate > 1) {
        redirect(`/wagers/respond/${wagerId}?error=too-aggressive`);
      }
    }

    await prisma.wager.update({
      where: { id: wagerId },
      data: { startValue, status: "ACTIVE" },
    });
    redirect("/wagers");
  }

  redirect("/wagers");
}

const inviteRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  note: z.string().trim().max(200).optional(),
});

// Lead capture only - no email gets sent from here. Surfaces on /admin for
// the maintainer to manually provision + invite out of band.
export async function submitInviteRequest(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  const userId = session.user.id;

  const parsed = inviteRequestSchema.safeParse({
    email: formData.get("email"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    redirect(`/wagers?${buildEchoParams(formData, "invalid-invite-email")}`);
  }

  const { email, note } = parsed.data;

  // Dedupe: don't pile up duplicate pending rows for the same email.
  const existing = await prisma.inviteRequest.findFirst({ where: { email } });
  if (!existing) {
    await prisma.inviteRequest.create({
      data: { email, note, invitedById: userId },
    });
  }

  redirect("/wagers?success=invite-sent");
}
