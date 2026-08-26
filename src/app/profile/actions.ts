"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { usernameSchema, checkUsernameTaken } from "@/lib/username";

const profileDetailsSchema = z.object({
  age: z.coerce.number().int().min(13).max(120),
  height: z.coerce.number().positive(),
  heightUnit: z.enum(["IN", "CM"]),
  mealPreference: z.enum(["CARNIVORE", "VEGETARIAN", "NO_PREFERENCE"]),
});

const CM_TO_IN = 0.393701;

export async function updateProfileDetails(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  const userId = session.user.id;

  const parsed = profileDetailsSchema.safeParse({
    age: formData.get("age"),
    height: formData.get("height"),
    heightUnit: formData.get("heightUnit"),
    mealPreference: formData.get("mealPreference"),
  });
  if (!parsed.success) {
    redirect("/profile?error=invalid-details");
  }

  const { age, heightUnit, mealPreference } = parsed.data;
  const heightInches = heightUnit === "CM" ? parsed.data.height * CM_TO_IN : parsed.data.height;

  const progress = await prisma.progress.findFirst({ where: { userId } });
  if (!progress) {
    redirect("/onboarding");
  }

  await prisma.progress.update({
    where: { id: progress.id },
    data: { age, heightInches, mealPreference },
  });

  revalidatePath("/profile");
  redirect("/profile?success=details");
}

export async function updateUsername(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  const userId = session.user.id;

  const rawUsername = formData.get("username");
  if (!rawUsername || typeof rawUsername !== "string") {
    redirect("/profile?error=missing");
  }

  const parsed = usernameSchema.safeParse(rawUsername);
  if (!parsed.success) {
    redirect("/profile?error=invalid-format");
  }

  const username = parsed.data;

  // Case-insensitive uniqueness check, excluding current user
  const isTaken = await checkUsernameTaken(username, userId);
  if (isTaken) {
    redirect("/profile?error=taken");
  }

  // Update user username
  await prisma.user.update({
    where: { id: userId },
    data: { username },
  });

  revalidatePath("/");
  revalidatePath("/profile");
  redirect("/profile?success=true");
}
