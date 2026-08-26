"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { usernameSchema, checkUsernameTaken } from "@/lib/username";

export async function chooseUsername(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  const userId = session.user.id;

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, termsAcceptedAt: true },
  });
  if (!existingUser?.termsAcceptedAt) {
    redirect("/welcome");
  }
  // If user already has a username, do not allow resetting it via this route
  if (existingUser?.username) {
    redirect("/");
  }

  const rawUsername = formData.get("username");
  if (!rawUsername || typeof rawUsername !== "string") {
    redirect("/choose-username?error=missing");
  }

  const parsed = usernameSchema.safeParse(rawUsername);
  if (!parsed.success) {
    redirect("/choose-username?error=invalid-format");
  }

  const username = parsed.data;

  // Case-insensitive uniqueness check
  const isTaken = await checkUsernameTaken(username);
  if (isTaken) {
    redirect("/choose-username?error=taken");
  }

  // Update the user record with the chosen username
  await prisma.user.update({
    where: { id: userId },
    data: { username },
  });

  revalidatePath("/");
  redirect("/");
}
