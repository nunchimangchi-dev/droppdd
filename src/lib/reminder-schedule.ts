// Pure scheduling rule for the daily check-in reminder. No imports on
// purpose, so node --test can run it directly (see reminder-schedule.test.ts).
//
// "Today" is the UTC calendar day, same as the check-in predicate in
// src/lib/streak.ts and src/lib/ai-limits.ts.
export interface ReminderInput {
  nowUtc: Date;
  reminderHourUtc: number | null;
  hasCheckInToday: boolean;
  lastReminderSentOn: string | null;
}

/** "YYYY-MM-DD" for the UTC calendar day of the given instant. */
export function utcDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function shouldSendReminder({
  nowUtc,
  reminderHourUtc,
  hasCheckInToday,
  lastReminderSentOn,
}: ReminderInput): boolean {
  if (reminderHourUtc === null) return false;
  if (nowUtc.getUTCHours() !== reminderHourUtc) return false;
  if (hasCheckInToday) return false;
  if (lastReminderSentOn === utcDateString(nowUtc)) return false;
  return true;
}
