"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BETA_USER_LIMIT } from "@/lib/beta-limit";

export async function checkAdmin() {
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

  // Admin invites don't count against the beta cap - only real beta testers do.
  if (!isAdmin) {
    const betaSlotsUsed = await prisma.allowedEmail.count({
      where: { isAdmin: false },
    });
    if (betaSlotsUsed >= BETA_USER_LIMIT) {
      redirect("/admin?error=beta-full");
    }
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

// Dismisses a pending invite request once the admin has manually handled
// it (either provisioned + emailed them, or decided not to) - decoupled
// on purpose from addAllowedEmail rather than auto-clearing on authorize,
// so a dismiss is always a deliberate, separate confirmation.
export async function dismissInviteRequest(formData: FormData) {
  if (!(await checkAdmin())) {
    redirect("/admin?error=unauthorized");
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    redirect("/admin?error=invalid-email");
  }

  await prisma.inviteRequest.delete({ where: { id } }).catch(() => {
    // Already dismissed/removed - not an error worth surfacing.
  });

  revalidatePath("/admin");
  redirect("/admin?success=invite-dismissed");
}
