"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPushConfigured } from "@/lib/push";

const preferencesSchema = z
  .object({
    reminderEnabled: z.boolean(),
    reminderHourUtc: z.number().int().min(0).max(23).nullable(),
    wagerEnabled: z.boolean(),
  })
  // No default time: turning reminders on requires an explicit choice.
  .refine((v) => !v.reminderEnabled || v.reminderHourUtc !== null);

export async function savePushPreferences(
  input: unknown
): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id || !isPushConfigured()) return { ok: false };

  const parsed = preferencesSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { reminderEnabled, reminderHourUtc, wagerEnabled } = parsed.data;

  const userId = session.user.id;
  // Changing the hour resets the dedupe marker's meaning only by date, so it
  // is left alone: at most one reminder per UTC day still holds.
  await prisma.notificationPreference.upsert({
    where: { userId },
    create: { userId, reminderEnabled, reminderHourUtc, wagerEnabled },
    update: { reminderEnabled, reminderHourUtc, wagerEnabled },
  });
  return { ok: true };
}
