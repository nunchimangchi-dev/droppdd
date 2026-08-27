"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "../admin/actions";

const BOARD_TYPES = ["BUG", "FEATURE", "DISCOVERY"] as const;
const BOARD_STATUSES = ["NEW", "PLANNED", "IN_PROGRESS", "DONE"] as const;

const createBoardItemSchema = z.object({
  type: z.enum(BOARD_TYPES),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(3).max(2000),
});

export async function createBoardItem(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const parsed = createBoardItemSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    description: formData.get("description"),
  });

  if (!parsed.success) {
    redirect("/board?error=invalid-card");
  }

  await prisma.boardItem.create({
    data: {
      type: parsed.data.type,
      title: parsed.data.title,
      description: parsed.data.description,
      createdById: session.user.id,
    },
  });

  revalidatePath("/board");
  redirect("/board?success=added");
}

const updateStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(BOARD_STATUSES),
});

export async function updateBoardItemStatus(formData: FormData) {
  if (!(await checkAdmin())) {
    redirect("/board?error=unauthorized");
  }

  const parsed = updateStatusSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    redirect("/board?error=invalid-card");
  }

  await prisma.boardItem.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  });

  revalidatePath("/board");
  redirect("/board?success=moved");
}

export async function deleteBoardItem(formData: FormData) {
  if (!(await checkAdmin())) {
    redirect("/board?error=unauthorized");
  }

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    redirect("/board?error=invalid-card");
  }

  await prisma.boardItem.delete({ where: { id } });

  revalidatePath("/board");
  redirect("/board?success=removed");
}
