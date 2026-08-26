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
  weightUnit: z.enum(["LBS", "KG"]),
  age: z.coerce.number().int().min(13).max(120),
  height: z.coerce.number().positive(),
  heightUnit: z.enum(["IN", "CM"]),
  mealPreference: z.enum(["CARNIVORE", "VEGETARIAN", "NO_PREFERENCE"]),
});

const KG_TO_LBS = 2.20462;
const CM_TO_IN = 0.393701;

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

  const parsed = onboardSchema.safeParse({
    currentWeight: formData.get("currentWeight"),
    targetWeight: formData.get("targetWeight"),
    startWeight: formData.get("startWeight"),
    weightUnit: formData.get("weightUnit"),
    age: formData.get("age"),
    height: formData.get("height"),
    heightUnit: formData.get("heightUnit"),
    mealPreference: formData.get("mealPreference"),
  });

  if (!parsed.success) {
    redirect("/onboarding?error=invalid-values");
  }

  const { weightUnit, heightUnit, age, mealPreference } = parsed.data;

  // Canonical storage units: weight in lbs, height in inches - convert
  // here so the rest of the app (leaderboard, wagers, dashboard) never
  // has to think about units.
  const toLbs = (v: number) => (weightUnit === "KG" ? v * KG_TO_LBS : v);
  const currentWeight = toLbs(parsed.data.currentWeight);
  const targetWeight = toLbs(parsed.data.targetWeight);
  const startWeight = toLbs(parsed.data.startWeight);
  const heightInches = heightUnit === "CM" ? parsed.data.height * CM_TO_IN : parsed.data.height;

  // Create progress
  await prisma.progress.create({
    data: {
      userId,
      currentStreak: 0,
      bestStreak: 0,
      currentWeight,
      targetWeight,
      startWeight,
      age,
      heightInches,
      mealPreference,
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
