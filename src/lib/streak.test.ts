import { test } from "node:test";
import assert from "node:assert/strict";
import { isNextCalendarDay, isSameCalendarDay } from "./streak.ts";

const d = (iso: string) => new Date(iso);

test("isSameCalendarDay compares UTC calendar days, not instants", () => {
  assert.equal(isSameCalendarDay(d("2025-03-10T00:00:00.000Z"), d("2025-03-10T23:59:59.999Z")), true);
  assert.equal(isSameCalendarDay(d("2025-03-10T23:59:59.999Z"), d("2025-03-11T00:00:00.000Z")), false);
  // Same time of day, different year / month must not match.
  assert.equal(isSameCalendarDay(d("2025-03-10T12:00:00Z"), d("2024-03-10T12:00:00Z")), false);
  assert.equal(isSameCalendarDay(d("2025-03-10T12:00:00Z"), d("2025-04-10T12:00:00Z")), false);
});

test("isSameCalendarDay uses UTC even when the offset says a different local day", () => {
  // 23:30 at -05:00 on the 10th is 04:30Z on the 11th.
  assert.equal(isSameCalendarDay(d("2025-03-10T23:30:00-05:00"), d("2025-03-11T01:00:00Z")), true);
});

test("isNextCalendarDay: midnight boundaries", () => {
  assert.equal(isNextCalendarDay(d("2025-03-10T00:00:00Z"), d("2025-03-11T00:00:00Z")), true);
  assert.equal(isNextCalendarDay(d("2025-03-10T23:59:59.999Z"), d("2025-03-11T00:00:00.000Z")), true);
  assert.equal(isNextCalendarDay(d("2025-03-10T00:00:00Z"), d("2025-03-11T23:59:59.999Z")), true);
  assert.equal(isNextCalendarDay(d("2025-03-10T12:00:00Z"), d("2025-03-10T23:59:59Z")), false);
  assert.equal(isNextCalendarDay(d("2025-03-10T12:00:00Z"), d("2025-03-12T00:00:00Z")), false);
});

test("isNextCalendarDay: a 23-hour gap across midnight is the next day", () => {
  assert.equal(isNextCalendarDay(d("2025-03-10T23:30:00Z"), d("2025-03-11T22:30:00Z")), true);
  // 23h but no midnight crossed: still the same day.
  assert.equal(isNextCalendarDay(d("2025-03-10T00:00:00Z"), d("2025-03-10T23:00:00Z")), false);
});

test("isNextCalendarDay: a gap over 24h can still be the next day", () => {
  assert.equal(isNextCalendarDay(d("2025-03-10T00:00:00Z"), d("2025-03-11T23:59:00Z")), true);
});

test("isNextCalendarDay: is directional", () => {
  assert.equal(isNextCalendarDay(d("2025-03-11T12:00:00Z"), d("2025-03-10T12:00:00Z")), false);
});

test("isNextCalendarDay: month, year and leap day rollover", () => {
  assert.equal(isNextCalendarDay(d("2025-01-31T10:00:00Z"), d("2025-02-01T10:00:00Z")), true);
  assert.equal(isNextCalendarDay(d("2025-12-31T10:00:00Z"), d("2026-01-01T10:00:00Z")), true);
  // 2024 is a leap year: Feb 28 -> Feb 29 -> Mar 1.
  assert.equal(isNextCalendarDay(d("2024-02-28T10:00:00Z"), d("2024-02-29T10:00:00Z")), true);
  assert.equal(isNextCalendarDay(d("2024-02-29T10:00:00Z"), d("2024-03-01T10:00:00Z")), true);
  assert.equal(isNextCalendarDay(d("2024-02-28T10:00:00Z"), d("2024-03-01T10:00:00Z")), false);
  // 2025 is not: Feb 28 -> Mar 1 directly.
  assert.equal(isNextCalendarDay(d("2025-02-28T10:00:00Z"), d("2025-03-01T10:00:00Z")), true);
});
