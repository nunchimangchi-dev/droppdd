"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function acceptTerms(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  const userId = session.user.id;

  const agreed = formData.get("agree");
  if (agreed !== "on") {
    redirect("/welcome?error=must-agree");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { termsAcceptedAt: new Date() },
  });

  redirect("/choose-username");
}
