import { afterEach, describe, mock, test } from "node:test";
import assert from "node:assert/strict";
import {
  computeCurrentStreak,
  computeMindfulnessStreak,
  countStrengthCompleted,
  isDayMet,
  isRestDayEligible,
  isStrengthMet,
} from "./checkin.ts";

const FIELDS = [
  "strengthPushups",
  "strengthSitups",
  "strengthPullups",
  "strengthFloorPress",
  "strengthFloorOverhead",
  "strengthPlanks",
] as const;

function strength(n: number) {
  const flags = {} as Record<(typeof FIELDS)[number], boolean>;
  FIELDS.forEach((f, i) => (flags[f] = i < n));
  return flags;
}

function day(iso: string, over: Partial<{ n: number; movement: boolean; eating: boolean; rest: boolean }> = {}) {
  return {
    checkInDate: new Date(iso),
    ...strength(over.n ?? 3),
    movementMet: over.movement ?? true,
    eatingMet: over.eating ?? true,
    restDay: over.rest ?? false,
  };
}

// "Now" is Mar 10 2025 15:00Z for every streak test.
function freezeNow(iso = "2025-03-10T15:00:00Z") {
  mock.timers.enable({ apis: ["Date"], now: new Date(iso).getTime() });
}
afterEach(() => mock.timers.reset());

describe("strength", () => {
  test("threshold is 3 of 6", () => {
    assert.equal(isStrengthMet(strength(2)), false);
    assert.equal(isStrengthMet(strength(3)), true);
    assert.equal(isStrengthMet(strength(6)), true);
    assert.equal(isStrengthMet(strength(0)), false);
  });

  test("countStrengthCompleted counts any combination, not just the first n", () => {
    assert.equal(countStrengthCompleted(strength(0)), 0);
    assert.equal(countStrengthCompleted(strength(6)), 6);
    const picky = { ...strength(0), strengthPlanks: true, strengthPullups: true };
    assert.equal(countStrengthCompleted(picky), 2);
    assert.equal(isStrengthMet({ ...picky, strengthSitups: true }), true);
  });
});

describe("isDayMet", () => {
  test("needs strength, movement and eating together", () => {
    assert.equal(isDayMet(day("2025-03-10T00:00:00Z")), true);
    assert.equal(isDayMet(day("2025-03-10T00:00:00Z", { n: 2 })), false);
    assert.equal(isDayMet(day("2025-03-10T00:00:00Z", { movement: false })), false);
    assert.equal(isDayMet(day("2025-03-10T00:00:00Z", { eating: false })), false);
  });

  test("a rest day satisfies the day even with nothing else done", () => {
    assert.equal(isDayMet(day("2025-03-10T00:00:00Z", { n: 0, movement: false, eating: false, rest: true })), true);
  });
});

describe("computeCurrentStreak", () => {
  test("empty history is 0", () => {
    freezeNow();
    assert.equal(computeCurrentStreak([]), 0);
  });

  test("consecutive days ending today", () => {
    freezeNow();
    const days = [day("2025-03-10T00:00:00Z"), day("2025-03-09T00:00:00Z"), day("2025-03-08T00:00:00Z")];
    assert.equal(computeCurrentStreak(days), 3);
  });

  test("input order does not matter", () => {
    freezeNow();
    const days = [day("2025-03-08T00:00:00Z"), day("2025-03-10T00:00:00Z"), day("2025-03-09T00:00:00Z")];
    assert.equal(computeCurrentStreak(days), 3);
  });

  test("today not yet checked in: a streak ending yesterday is still alive", () => {
    freezeNow();
    const days = [day("2025-03-09T00:00:00Z"), day("2025-03-08T00:00:00Z")];
    assert.equal(computeCurrentStreak(days), 2);
  });

  test("most recent check-in two days ago is a dead streak", () => {
    freezeNow();
    assert.equal(computeCurrentStreak([day("2025-03-08T00:00:00Z")]), 0);
  });

  test("a gap breaks the streak and older days are not counted", () => {
    freezeNow();
    const days = [day("2025-03-10T00:00:00Z"), day("2025-03-09T00:00:00Z"), day("2025-03-07T00:00:00Z"), day("2025-03-06T00:00:00Z")];
    assert.equal(computeCurrentStreak(days), 2);
  });

  test("an unmet day in the middle stops the count", () => {
    freezeNow();
    const days = [day("2025-03-10T00:00:00Z"), day("2025-03-09T00:00:00Z", { n: 2 }), day("2025-03-08T00:00:00Z")];
    assert.equal(computeCurrentStreak(days), 1);
  });

  test("a claimed rest day keeps the streak going", () => {
    freezeNow();
    const days = [
      day("2025-03-10T00:00:00Z"),
      day("2025-03-09T00:00:00Z", { n: 0, movement: false, eating: false, rest: true }),
      day("2025-03-08T00:00:00Z"),
    ];
    assert.equal(computeCurrentStreak(days), 3);
  });

  test("check-in times within the day do not matter, only the UTC date", () => {
    freezeNow("2025-03-10T00:00:01Z");
    const days = [day("2025-03-09T23:59:59Z"), day("2025-03-08T00:00:00Z")];
    assert.equal(computeCurrentStreak(days), 2);
  });

  test("streak crosses month and year boundaries", () => {
    freezeNow("2026-01-02T10:00:00Z");
    const days = [day("2026-01-02T00:00:00Z"), day("2026-01-01T00:00:00Z"), day("2025-12-31T00:00:00Z"), day("2025-12-30T00:00:00Z")];
    assert.equal(computeCurrentStreak(days), 4);
  });

  test("a partial check-in today does not break a live streak from yesterday", () => {
    // Today is still in progress, so an unmet row for today is skipped and
    // the count runs back from yesterday, same as the "no row yet" case.
    freezeNow();
    const days = [day("2025-03-10T00:00:00Z", { n: 1 }), day("2025-03-09T00:00:00Z"), day("2025-03-08T00:00:00Z")];
    assert.equal(computeCurrentStreak(days), 2);
  });

  test("a partial check-in today does not hide a longer streak behind it", () => {
    freezeNow();
    const days = [
      day("2025-03-10T00:00:00Z", { movement: false }),
      day("2025-03-09T00:00:00Z"),
      day("2025-03-08T00:00:00Z"),
      day("2025-03-07T00:00:00Z"),
    ];
    assert.equal(computeCurrentStreak(days), 3);
  });

  test("an unmet row for yesterday still ends the streak", () => {
    freezeNow();
    const days = [day("2025-03-10T00:00:00Z"), day("2025-03-09T00:00:00Z", { n: 1 }), day("2025-03-08T00:00:00Z")];
    assert.equal(computeCurrentStreak(days), 1);
  });

  test("asOf evaluates the streak at a past instant and ignores later rows", () => {
    freezeNow();
    const days = [
      day("2025-03-10T00:00:00Z"),
      day("2025-03-09T00:00:00Z"),
      day("2025-03-08T00:00:00Z"),
      day("2025-03-07T00:00:00Z"),
    ];
    assert.equal(computeCurrentStreak(days, new Date("2025-03-08T23:59:59.999Z")), 2);
    assert.equal(computeCurrentStreak(days, new Date("2025-03-06T23:59:59.999Z")), 0);
  });

  test("SUSPECT: two rows on the same day cut the streak short", () => {
    // The second row for Mar 10 is not the "expected" Mar 9, so the walk stops.
    // Prior days are not counted even though they are consecutive.
    freezeNow();
    const days = [day("2025-03-10T00:00:00Z"), day("2025-03-10T08:00:00Z"), day("2025-03-09T00:00:00Z")];
    assert.equal(computeCurrentStreak(days), 1);
  });

  test("a future-dated check-in is ignored", () => {
    freezeNow();
    const days = [day("2025-03-12T00:00:00Z"), day("2025-03-10T00:00:00Z"), day("2025-03-09T00:00:00Z")];
    assert.equal(computeCurrentStreak(days), 2);
  });
});

describe("computeMindfulnessStreak", () => {
  const m = (iso: string, mindfulnessMet: boolean) => ({ checkInDate: new Date(iso), mindfulnessMet });

  test("counts consecutive mindfulness days and uses the same today/yesterday rule", () => {
    freezeNow();
    assert.equal(computeMindfulnessStreak([]), 0);
    assert.equal(computeMindfulnessStreak([m("2025-03-10T00:00:00Z", true), m("2025-03-09T00:00:00Z", true)]), 2);
    assert.equal(computeMindfulnessStreak([m("2025-03-09T00:00:00Z", true)]), 1);
    assert.equal(computeMindfulnessStreak([m("2025-03-08T00:00:00Z", true)]), 0);
  });

  test("an unmet day or a gap breaks it", () => {
    freezeNow();
    assert.equal(computeMindfulnessStreak([m("2025-03-10T00:00:00Z", true), m("2025-03-09T00:00:00Z", false), m("2025-03-08T00:00:00Z", true)]), 1);
    assert.equal(computeMindfulnessStreak([m("2025-03-10T00:00:00Z", true), m("2025-03-08T00:00:00Z", true)]), 1);
  });

  test("mindfulness never gates the main streak, and rest days do not affect it", () => {
    freezeNow();
    const days = [
      { ...day("2025-03-10T00:00:00Z"), mindfulnessMet: false },
      { ...day("2025-03-09T00:00:00Z", { n: 0, movement: false, eating: false, rest: true }), mindfulnessMet: false },
    ];
    assert.equal(computeCurrentStreak(days), 2);
    assert.equal(computeMindfulnessStreak(days), 0);
  });
});

describe("isRestDayEligible", () => {
  const now = new Date("2025-03-10T12:00:00Z");

  test("never taken a rest day is eligible", () => {
    assert.equal(isRestDayEligible(null, now), true);
  });

  test("eligible at exactly 7 days, not before", () => {
    assert.equal(isRestDayEligible(new Date("2025-03-03T12:00:00Z"), now), true);
    assert.equal(isRestDayEligible(new Date("2025-03-03T12:00:00.001Z"), now), false);
    assert.equal(isRestDayEligible(new Date("2025-03-10T00:00:00Z"), now), false);
  });

  test("floating: eligibility follows the last rest day, not a fixed weekday", () => {
    assert.equal(isRestDayEligible(new Date("2025-02-01T00:00:00Z"), now), true);
    assert.equal(isRestDayEligible(new Date("2025-03-05T00:00:00Z"), now), false);
  });

  test("SUSPECT: uses elapsed milliseconds, not calendar days like the streak does", () => {
    // Rest day on Mar 3 at 23:00Z is not eligible at Mar 10 00:00Z even
    // though 7 UTC calendar days have passed.
    assert.equal(isRestDayEligible(new Date("2025-03-03T23:00:00Z"), new Date("2025-03-10T00:00:00Z")), false);
  });

  test("defaults now to the current time", () => {
    freezeNow();
    assert.equal(isRestDayEligible(new Date("2025-03-03T15:00:00Z")), true);
    assert.equal(isRestDayEligible(new Date("2025-03-03T15:00:01Z")), false);
  });
});
