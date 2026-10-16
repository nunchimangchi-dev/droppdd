import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dayStartUtc } from "@/lib/ai-limits";
import { isPushConfigured, sendToUser } from "@/lib/push";
import { safeEqual } from "@/lib/push-api";
import { shouldSendReminder, utcDateString } from "@/lib/reminder-schedule";

// Reminder sender, called every 15 minutes by an unattended systemd timer
// on the host with a bearer token, not by a browser. /api is excluded from
// proxy.ts's session redirect, so this does its own token check (same
// pattern as the nunchi-board metrics route, with a constant-time compare).
export async function POST(request: NextRequest) {
  const expectedToken = process.env.PUSH_CRON_TOKEN;
  if (!expectedToken || !isPushConfigured()) {
    return NextResponse.json({ error: "Push cron not configured" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  const presentedToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;
  if (!presentedToken || !safeEqual(presentedToken, expectedToken)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const nowUtc = new Date();
  const today = utcDateString(nowUtc);
  const dayStart = dayStartUtc(nowUtc);

  // Opted-in users whose chosen hour is now and who have at least one device.
  const candidates = await prisma.notificationPreference.findMany({
    where: {
      reminderEnabled: true,
      reminderHourUtc: nowUtc.getUTCHours(),
      user: { pushSubscriptions: { some: {} } },
    },
    select: { userId: true, reminderHourUtc: true, lastReminderSentOn: true },
  });

  let sent = 0;
  for (const pref of candidates) {
    const checkIn = await prisma.dailyCheckIn.findFirst({
      where: { userId: pref.userId, checkInDate: { gte: dayStart } },
      select: { id: true },
    });

    if (
      !shouldSendReminder({
        nowUtc,
        reminderHourUtc: pref.reminderHourUtc,
        hasCheckInToday: checkIn !== null,
        lastReminderSentOn: pref.lastReminderSentOn,
      })
    ) {
      continue;
    }

    const result = await sendToUser(pref.userId, {
      title: "Daily check-in",
      body: "Time for your DROPPDD check-in.",
      url: "/checkin",
    });
    // Only mark the day done if a device actually got it, so a total
    // failure is retried on the next run inside the same hour.
    if (result.sent > 0) {
      await prisma.notificationPreference.update({
        where: { userId: pref.userId },
        data: { lastReminderSentOn: today },
      });
      sent++;
    }
  }

  return NextResponse.json({ checked: candidates.length, sent });
}
