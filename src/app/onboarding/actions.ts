"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const onboardSchema = z.object({
  currentWeight: z.coerce.number().positive(),
  targetWeight: z.coerce.number().positive(),
  startWeight: z.coerce.number().positive(),
});

export async function onboardUser(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  const userId = session.user.id;

  // Ensure the user doesn't already have progress data
  const existing = await prisma.progress.findFirst({
    where: { userId },
  });
  if (existing) {
    redirect("/");
  }

  const rawCurrentWeight = formData.get("currentWeight");
  const rawTargetWeight = formData.get("targetWeight");
  const rawStartWeight = formData.get("startWeight");

  const parsed = onboardSchema.safeParse({
    currentWeight: rawCurrentWeight,
    targetWeight: rawTargetWeight,
    startWeight: rawStartWeight,
  });

  if (!parsed.success) {
    redirect("/onboarding?error=invalid-values");
  }

  const { currentWeight, targetWeight, startWeight } = parsed.data;

  // Create progress
  await prisma.progress.create({
    data: {
      userId,
      currentStreak: 0,
      bestStreak: 0,
      currentWeight,
      targetWeight,
      startWeight,
    },
  });

  // Create initial WeightRecord
  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  }); // e.g., "Aug 25"
  await prisma.weightRecord.create({
    data: {
      userId,
      date: dateStr,
      weight: currentWeight,
    },
  });

  revalidatePath("/");
  revalidatePath("/progress");
  redirect("/");
}
