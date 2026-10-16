import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldSendReminder, utcDateString } from "./reminder-schedule.ts";

const base = {
  nowUtc: new Date("2026-10-16T14:20:00Z"),
  reminderHourUtc: 14,
  hasCheckInToday: false,
  lastReminderSentOn: null as string | null,
};

test("sends in the chosen hour when nothing has happened today", () => {
  assert.equal(shouldSendReminder(base), true);
});

test("does not send outside the chosen UTC hour", () => {
  assert.equal(shouldSendReminder({ ...base, reminderHourUtc: 13 }), false);
  assert.equal(shouldSendReminder({ ...base, reminderHourUtc: 15 }), false);
});

test("does not send when no hour is set", () => {
  assert.equal(shouldSendReminder({ ...base, reminderHourUtc: null }), false);
});

test("does not send when already checked in for the current UTC day", () => {
  assert.equal(shouldSendReminder({ ...base, hasCheckInToday: true }), false);
});

test("does not send when already sent today", () => {
  assert.equal(shouldSendReminder({ ...base, lastReminderSentOn: "2026-10-16" }), false);
});

test("sends when the last reminder was a previous day", () => {
  assert.equal(shouldSendReminder({ ...base, lastReminderSentOn: "2026-10-15" }), true);
});

test("hour boundaries are inclusive of :00 and exclusive of the next hour", () => {
  assert.equal(shouldSendReminder({ ...base, nowUtc: new Date("2026-10-16T14:00:00Z") }), true);
  assert.equal(shouldSendReminder({ ...base, nowUtc: new Date("2026-10-16T14:59:59Z") }), true);
  assert.equal(shouldSendReminder({ ...base, nowUtc: new Date("2026-10-16T15:00:00Z") }), false);
});

test("utcDateString uses the UTC day, not local time", () => {
  assert.equal(utcDateString(new Date("2026-10-16T23:59:59Z")), "2026-10-16");
  assert.equal(utcDateString(new Date("2026-10-17T00:00:00Z")), "2026-10-17");
});
