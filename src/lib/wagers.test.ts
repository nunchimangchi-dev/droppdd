import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateWager, formatMetricValue, impliedWeeklyRatePercent } from "./wagers.ts";

const end = new Date("2025-06-30T00:00:00Z");
const before = new Date("2025-06-29T23:59:59.999Z");
const after = new Date("2025-06-30T00:00:00.001Z");

const loss = { metric: "WEIGHT_TARGET", startValue: 200, targetValue: 180, endDate: end };
const gain = { metric: "WEIGHT_TARGET", startValue: 150, targetValue: 170, endDate: end };
const streak = { metric: "STREAK_TARGET", startValue: 0, targetValue: 30, endDate: end };
const p = (currentWeight: number, currentStreak = 0) => ({ currentWeight, currentStreak });

test("WEIGHT_TARGET loss goal: win at and below target, active above", () => {
  assert.equal(evaluateWager(loss, p(180), before), "WON");
  assert.equal(evaluateWager(loss, p(175), before), "WON");
  assert.equal(evaluateWager(loss, p(180.1), before), "ACTIVE");
});

test("WEIGHT_TARGET gain goal: win at and above target, active below", () => {
  assert.equal(evaluateWager(gain, p(170), before), "WON");
  assert.equal(evaluateWager(gain, p(169.9), before), "ACTIVE");
});

test("STREAK_TARGET: win at and above target, ignores weight", () => {
  assert.equal(evaluateWager(streak, p(0, 30), before), "WON");
  assert.equal(evaluateWager(streak, p(0, 45), before), "WON");
  assert.equal(evaluateWager(streak, p(0, 29), before), "ACTIVE");
  assert.equal(evaluateWager(streak, p(100, 0), before), "ACTIVE");
});

test("weight progress does not win a streak wager and vice versa", () => {
  assert.equal(evaluateWager(loss, p(100, 999), before), "WON"); // weight hit
  assert.equal(evaluateWager(loss, p(300, 999), before), "ACTIVE"); // streak ignored
});

test("end date boundary: exactly at endDate is still ACTIVE, one ms later is LOST", () => {
  assert.equal(evaluateWager(loss, p(190), end), "ACTIVE");
  assert.equal(evaluateWager(loss, p(190), after), "LOST");
});

test("hitting the target exactly at the end date wins", () => {
  assert.equal(evaluateWager(loss, p(180), end), "WON");
});

test("SUSPECT: a target hit after the deadline still wins", () => {
  // The win check runs before the deadline check, so a late evaluation
  // (e.g. a cron that runs days after endDate) flips LOST-worthy wagers to WON.
  assert.equal(evaluateWager(loss, p(179), after), "WON");
});

test("null progress: ACTIVE until the end date passes, then LOST", () => {
  assert.equal(evaluateWager(loss, null, before), "ACTIVE");
  assert.equal(evaluateWager(loss, null, end), "ACTIVE");
  assert.equal(evaluateWager(loss, null, after), "LOST");
});

test("unknown metric can never win and only expires", () => {
  const odd = { ...loss, metric: "SOMETHING_ELSE" };
  assert.equal(evaluateWager(odd, p(0, 9999), before), "ACTIVE");
  assert.equal(evaluateWager(odd, p(0, 9999), after), "LOST");
});

test("SUSPECT: a weight wager with target equal to start wins immediately at or above start", () => {
  // targetValue < startValue is false, so it is treated as a gain goal
  // and currentWeight >= target is true from day one.
  const flat = { ...loss, targetValue: 200 };
  assert.equal(evaluateWager(flat, p(200), before), "WON");
});

test("formatMetricValue", () => {
  assert.equal(formatMetricValue("WEIGHT_TARGET", 180), "180 LBS");
  assert.equal(formatMetricValue("WEIGHT_TARGET", 180.5), "180.5 LBS");
  assert.equal(formatMetricValue("STREAK_TARGET", 30), "30 DAYS");
  // Anything that is not WEIGHT_TARGET falls through to DAYS.
  assert.equal(formatMetricValue("UNKNOWN", 7), "7 DAYS");
});

test("impliedWeeklyRatePercent: loss over several weeks", () => {
  // 20 of 200 lb = 10% over 4 weeks = 2.5 per week.
  const rate = impliedWeeklyRatePercent(200, 180, new Date("2025-06-01T00:00:00Z"), new Date("2025-06-29T00:00:00Z"));
  assert.equal(rate, 2.5);
});

test("impliedWeeklyRatePercent: direction does not matter (absolute change)", () => {
  const s = new Date("2025-06-01T00:00:00Z");
  const e = new Date("2025-06-29T00:00:00Z");
  assert.equal(impliedWeeklyRatePercent(200, 220, s, e), impliedWeeklyRatePercent(200, 180, s, e));
});

test("impliedWeeklyRatePercent: windows shorter than a day floor at one day", () => {
  const s = new Date("2025-06-01T00:00:00Z");
  // 10% change over a floor of 1/7 week = 70.
  assert.equal(impliedWeeklyRatePercent(200, 180, s, s), 70);
  const sameDay = new Date("2025-06-01T12:00:00Z");
  assert.equal(impliedWeeklyRatePercent(200, 180, s, sameDay), 70);
  // SUSPECT: an endDate before startDate is silently treated like a one-day window.
  assert.equal(impliedWeeklyRatePercent(200, 180, s, new Date("2025-05-01T00:00:00Z")), 70);
});

test("SUSPECT: impliedWeeklyRatePercent with startValue 0 is not finite", () => {
  const s = new Date("2025-06-01T00:00:00Z");
  const e = new Date("2025-06-29T00:00:00Z");
  assert.equal(impliedWeeklyRatePercent(0, 10, s, e), Infinity);
  assert.ok(Number.isNaN(impliedWeeklyRatePercent(0, 0, s, e)));
});
