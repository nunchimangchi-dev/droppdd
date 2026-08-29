"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isSameCalendarDay } from "@/lib/streak";
import { computeCurrentStreak, isRestDayEligible } from "@/lib/checkin";

// Unchecked checkboxes come back as `null` from formData.get(), not
// `undefined` - .optional() alone rejects null, so every field here
// needs .nullable() too, or a valid submission with anything unchecked
// gets rejected.
const checkInSchema = z.object({
  strengthPushups: z.literal("on").nullable().optional(),
  strengthSitups: z.literal("on").nullable().optional(),
  strengthPullups: z.literal("on").nullable().optional(),
  strengthFloorPress: z.literal("on").nullable().optional(),
  strengthFloorOverhead: z.literal("on").nullable().optional(),
  strengthPlanks: z.literal("on").nullable().optional(),
  movementMet: z.literal("on").nullable().optional(),
  eatingMet: z.literal("on").nullable().optional(),
  weight: z.coerce.number().positive().nullable().optional(),
  weightUnit: z.enum(["LBS", "KG"]).nullable().optional(),
});

const KG_TO_LBS = 2.20462;

async function recomputeAndSaveStreak(userId: string) {
  const progress = await prisma.progress.findFirst({ where: { userId } });
  if (!progress) return;

  const checkIns = await prisma.dailyCheckIn.findMany({ where: { userId } });
  const newStreak = computeCurrentStreak(checkIns);

  await prisma.progress.update({
    where: { id: progress.id },
    data: {
      currentStreak: newStreak,
      bestStreak: Math.max(progress.bestStreak, newStreak),
    },
  });
}

export async function checkIn(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  const userId = session.user.id;

  const progress = await prisma.progress.findFirst({ where: { userId } });
  if (!progress) {
    redirect("/onboarding");
  }

  const parsed = checkInSchema.safeParse({
    strengthPushups: formData.get("strengthPushups"),
    strengthSitups: formData.get("strengthSitups"),
    strengthPullups: formData.get("strengthPullups"),
    strengthFloorPress: formData.get("strengthFloorPress"),
    strengthFloorOverhead: formData.get("strengthFloorOverhead"),
    strengthPlanks: formData.get("strengthPlanks"),
    movementMet: formData.get("movementMet"),
    eatingMet: formData.get("eatingMet"),
    weight: formData.get("weight") || undefined,
    weightUnit: formData.get("weightUnit") || undefined,
  });
  if (!parsed.success) {
    redirect("/checkin?error=invalid-entry");
  }

  const d = parsed.data;
  const strengthFlags = {
    strengthPushups: d.strengthPushups === "on",
    strengthSitups: d.strengthSitups === "on",
    strengthPullups: d.strengthPullups === "on",
    strengthFloorPress: d.strengthFloorPress === "on",
    strengthFloorOverhead: d.strengthFloorOverhead === "on",
    strengthPlanks: d.strengthPlanks === "on",
  };
  const movementMet = d.movementMet === "on";
  const eatingMet = d.eatingMet === "on";

  const now = new Date();

  // Same-day dedupe: correcting today's entry updates it in place rather
  // than creating a second row for the same day.
  const mostRecent = await prisma.dailyCheckIn.findFirst({
    where: { userId },
    orderBy: { checkInDate: "desc" },
  });

  if (mostRecent && isSameCalendarDay(mostRecent.checkInDate, now)) {
    await prisma.dailyCheckIn.update({
      where: { id: mostRecent.id },
      data: { ...strengthFlags, movementMet, eatingMet },
    });
  } else {
    await prisma.dailyCheckIn.create({
      data: { userId, checkInDate: now, ...strengthFlags, movementMet, eatingMet },
    });
  }

  // Weight logging is optional now - WeightRecord/Progress.currentWeight
  // only update if a value was actually provided.
  if (d.weight != null && d.weightUnit) {
    const weightLbs = d.weightUnit === "KG" ? d.weight * KG_TO_LBS : d.weight;
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "2-digit" });

    const lastWeight = await prisma.weightRecord.findFirst({
      where: { userId },
      orderBy: { recordedAt: "desc" },
    });

    if (lastWeight && isSameCalendarDay(lastWeight.recordedAt, now)) {
      await prisma.weightRecord.update({
        where: { id: lastWeight.id },
        data: { weight: weightLbs, date: dateStr },
      });
    } else {
      await prisma.weightRecord.create({
        data: { userId, date: dateStr, recordedAt: now, weight: weightLbs },
      });
    }

    await prisma.progress.update({
      where: { id: progress.id },
      data: { currentWeight: weightLbs },
    });
  }

  await recomputeAndSaveStreak(userId);

  revalidatePath("/");
  revalidatePath("/progress");
  revalidatePath("/checkin");
  redirect("/?checkin=success");
}

export async function takeRestDay() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  const userId = session.user.id;

  const progress = await prisma.progress.findFirst({ where: { userId } });
  if (!progress) {
    redirect("/onboarding");
  }

  const now = new Date();

  // Re-checked server-side, not just hidden in the UI - the eligibility
  // gate is enforced here regardless of what the client shows.
  const lastRestDay = await prisma.dailyCheckIn.findFirst({
    where: { userId, restDay: true },
    orderBy: { checkInDate: "desc" },
  });
  if (!isRestDayEligible(lastRestDay?.checkInDate ?? null, now)) {
    redirect("/checkin?error=rest-day-not-eligible");
  }

  const mostRecent = await prisma.dailyCheckIn.findFirst({
    where: { userId },
    orderBy: { checkInDate: "desc" },
  });

  if (mostRecent && isSameCalendarDay(mostRecent.checkInDate, now)) {
    await prisma.dailyCheckIn.update({
      where: { id: mostRecent.id },
      data: { restDay: true },
    });
  } else {
    await prisma.dailyCheckIn.create({
      data: { userId, checkInDate: now, restDay: true },
    });
  }

  await recomputeAndSaveStreak(userId);

  revalidatePath("/");
  revalidatePath("/progress");
  revalidatePath("/checkin");
  redirect("/?checkin=success");
}
