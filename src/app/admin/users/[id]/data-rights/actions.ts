"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "../../../actions";

export async function deleteUserData(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    redirect("/?error=unauthorized");
  }

  const userId = formData.get("userId");
  const exportAcknowledged = formData.get("exportAcknowledged");
  const confirmation = formData.get("confirmation");

  if (typeof userId !== "string" || !userId) {
    redirect("/admin/users?error=not-found");
  }

  if (exportAcknowledged !== "on") {
    redirect(`/admin/users/${userId}/data-rights?error=not-acknowledged`);
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, email: true },
  });

  if (!target) {
    redirect("/admin/users?error=not-found");
  }

  // Re-verify the typed confirmation server-side against the real value -
  // never trust that the client-rendered "type this exactly" text wasn't
  // tampered with before submission.
  const expected = target.username ?? target.email ?? "";
  if (typeof confirmation !== "string" || confirmation.trim() !== expected) {
    redirect(`/admin/users/${userId}/data-rights?error=confirmation-mismatch`);
  }

  // Cascades through Account, Session, Progress, WeightRecord, and every
  // Wager row (both created and challenged) - verified directly against
  // dev data before this flow was built, not assumed.
  await prisma.user.delete({ where: { id: userId } });

  console.log(
    `[data-rights] User deleted: id=${target.id} username=${target.username ?? "(none)"} email=${target.email ?? "(none)"} by admin=${session.user.email} at=${new Date().toISOString()}`
  );

  redirect("/admin/users?success=deleted");
}
