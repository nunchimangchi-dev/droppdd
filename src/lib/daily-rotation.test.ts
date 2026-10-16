import { test } from "node:test";
import assert from "node:assert/strict";
import { dayOfYearOffset } from "./daily-rotation.ts";

test("Jan 1 is day 1 (1-based), so it maps to offset 1 % count", () => {
  assert.equal(dayOfYearOffset(10, new Date("2025-01-01T00:00:00Z")), 1);
  // SUSPECT: because the day number is 1-based, index 0 is never picked on
  // Jan 1 (only when count is 1).
  assert.equal(dayOfYearOffset(1, new Date("2025-01-01T00:00:00Z")), 0);
});

test("Dec 31 is day 365 in a common year and 366 in a leap year", () => {
  assert.equal(dayOfYearOffset(1000, new Date("2025-12-31T12:00:00Z")), 365);
  assert.equal(dayOfYearOffset(1000, new Date("2024-12-31T12:00:00Z")), 366);
});

test("leap day shifts later days by one", () => {
  assert.equal(dayOfYearOffset(1000, new Date("2024-02-29T00:00:00Z")), 60);
  assert.equal(dayOfYearOffset(1000, new Date("2024-03-01T00:00:00Z")), 61);
  assert.equal(dayOfYearOffset(1000, new Date("2025-03-01T00:00:00Z")), 60);
});

test("same UTC day gives the same pick regardless of time of day", () => {
  const a = dayOfYearOffset(7, new Date("2025-06-15T00:00:00.000Z"));
  const b = dayOfYearOffset(7, new Date("2025-06-15T23:59:59.999Z"));
  assert.equal(a, b);
});

test("wraps around the count and rotates by one each day", () => {
  assert.equal(dayOfYearOffset(7, new Date("2025-01-07T00:00:00Z")), 0);
  assert.equal(dayOfYearOffset(7, new Date("2025-01-08T00:00:00Z")), 1);
});

test("count of zero or less returns 0", () => {
  assert.equal(dayOfYearOffset(0, new Date("2025-06-15T00:00:00Z")), 0);
  assert.equal(dayOfYearOffset(-3, new Date("2025-06-15T00:00:00Z")), 0);
});

test("the offset resets across the year boundary", () => {
  // Dec 31 2025 = 365, 365 % 10 = 5; Jan 1 2026 = 1.
  assert.equal(dayOfYearOffset(10, new Date("2025-12-31T00:00:00Z")), 5);
  assert.equal(dayOfYearOffset(10, new Date("2026-01-01T00:00:00Z")), 1);
});
