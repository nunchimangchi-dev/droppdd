"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { usernameSchema, checkUsernameTaken } from "@/lib/username";

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
