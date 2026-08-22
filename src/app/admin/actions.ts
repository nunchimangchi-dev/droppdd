"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.email) {
    return false;
  }
  const allowed = await prisma.allowedEmail.findUnique({
    where: { email: session.user.email },
  });
  return allowed?.isAdmin === true;
}

const addEmailSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  isAdmin: z.boolean().default(false),
});

export async function addAllowedEmail(formData: FormData) {
  if (!(await checkAdmin())) {
    redirect("/admin?error=unauthorized");
  }

  const rawEmail = formData.get("email");
  const rawIsAdmin = formData.get("isAdmin") === "on";

  const parsed = addEmailSchema.safeParse({
    email: rawEmail,
    isAdmin: rawIsAdmin,
  });

  if (!parsed.success) {
    redirect("/admin?error=invalid-email");
  }

  const { email, isAdmin } = parsed.data;

  const existing = await prisma.allowedEmail.findUnique({
    where: { email },
  });

  if (existing) {
    redirect("/admin?error=email-exists");
  }

  await prisma.allowedEmail.create({
    data: {
      email,
      isAdmin,
    },
  });

  revalidatePath("/admin");
  redirect("/admin?success=added");
}

export async function toggleAdminStatus(formData: FormData) {
  if (!(await checkAdmin())) {
    redirect("/admin?error=unauthorized");
  }

  const rawEmail = formData.get("email");
  if (!rawEmail || typeof rawEmail !== "string") {
    redirect("/admin?error=invalid-email");
  }
  const email = rawEmail.trim().toLowerCase();

  const target = await prisma.allowedEmail.findUnique({
    where: { email },
  });

  if (!target) {
    redirect("/admin?error=email-not-found");
  }

  // Enforce last admin invariant: if target is admin and we are demoting them,
  // check if they are the only admin left.
  if (target.isAdmin) {
    const adminCount = await prisma.allowedEmail.count({
      where: { isAdmin: true },
    });
    if (adminCount <= 1) {
      redirect("/admin?error=last-admin");
    }
  }

  await prisma.allowedEmail.update({
    where: { email },
    data: {
      isAdmin: !target.isAdmin,
    },
  });

  revalidatePath("/admin");
  redirect("/admin?success=toggled");
}

export async function removeAllowedEmail(formData: FormData) {
  if (!(await checkAdmin())) {
    redirect("/admin?error=unauthorized");
  }

  const rawEmail = formData.get("email");
  if (!rawEmail || typeof rawEmail !== "string") {
    redirect("/admin?error=invalid-email");
  }
  const email = rawEmail.trim().toLowerCase();

  const target = await prisma.allowedEmail.findUnique({
    where: { email },
  });

  if (!target) {
    redirect("/admin?error=email-not-found");
  }

  // Enforce last admin invariant: if target is admin and we are removing them,
  // check if they are the only admin left.
  if (target.isAdmin) {
    const adminCount = await prisma.allowedEmail.count({
      where: { isAdmin: true },
    });
    if (adminCount <= 1) {
      redirect("/admin?error=last-admin");
    }
  }

  await prisma.allowedEmail.delete({
    where: { email },
  });

  revalidatePath("/admin");
  redirect("/admin?success=removed");
}
