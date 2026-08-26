"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isSameCalendarDay, isNextCalendarDay } from "@/lib/streak";

const checkInSchema = z.object({
  weight: z.coerce.number().positive(),
  weightUnit: z.enum(["LBS", "KG"]),
});

const KG_TO_LBS = 2.20462;

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
    weight: formData.get("weight"),
    weightUnit: formData.get("weightUnit"),
  });
  if (!parsed.success) {
    redirect("/checkin?error=invalid-weight");
  }

  const weightLbs = parsed.data.weightUnit === "KG" ? parsed.data.weight * KG_TO_LBS : parsed.data.weight;
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "2-digit" });

  const lastRecord = await prisma.weightRecord.findFirst({
    where: { userId },
    orderBy: { recordedAt: "desc" },
  });

  let newStreak = progress.currentStreak;

  if (lastRecord && isSameCalendarDay(lastRecord.recordedAt, now)) {
    // Already checked in today - correct today's entry, streak unchanged.
    await prisma.weightRecord.update({
      where: { id: lastRecord.id },
      data: { weight: weightLbs, date: dateStr },
    });
  } else {
    await prisma.weightRecord.create({
      data: { userId, date: dateStr, recordedAt: now, weight: weightLbs },
    });
    newStreak = lastRecord && isNextCalendarDay(lastRecord.recordedAt, now)
      ? progress.currentStreak + 1
      : 1; // no prior record, or a gap - streak (re)starts at 1
  }

  await prisma.progress.update({
    where: { id: progress.id },
    data: {
      currentWeight: weightLbs,
      currentStreak: newStreak,
      bestStreak: Math.max(progress.bestStreak, newStreak),
    },
  });

  revalidatePath("/");
  revalidatePath("/progress");
  revalidatePath("/checkin");
  redirect("/?checkin=success");
}
