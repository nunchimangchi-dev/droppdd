import { isSameCalendarDay } from "./streak";

// Single source of truth for the 6 strength exercises - used by the
// check-in form, the streak calculation, and the Attack reference page.
export const STRENGTH_EXERCISES = [
  { field: "strengthPushups", label: "Pushups", sets: 3, reps: "15" },
  { field: "strengthSitups", label: "Sit-ups", sets: 3, reps: "15" },
  { field: "strengthPullups", label: "Pull-ups", sets: 3, reps: "15" },
  { field: "strengthFloorPress", label: "Dumbbell Floor Press", sets: 3, reps: "15" },
  { field: "strengthFloorOverhead", label: "Dumbbell Floor Overhead Press", sets: 3, reps: "15" },
  { field: "strengthPlanks", label: "Planks", sets: 3, reps: "30 sec" },
] as const;

export const STRENGTH_THRESHOLD = 3; // complete any 3 of the 6 to go green

export const REST_DAY_INTERVAL_DAYS = 7;

type StrengthFlags = {
  strengthPushups: boolean;
  strengthSitups: boolean;
  strengthPullups: boolean;
  strengthFloorPress: boolean;
  strengthFloorOverhead: boolean;
  strengthPlanks: boolean;
};

export function countStrengthCompleted(c: StrengthFlags): number {
  return STRENGTH_EXERCISES.reduce((n, { field }) => n + (c[field] ? 1 : 0), 0);
}

export function isStrengthMet(c: StrengthFlags): boolean {
  return countStrengthCompleted(c) >= STRENGTH_THRESHOLD;
}

type DayRecord = StrengthFlags & {
  checkInDate: Date;
  movementMet: boolean;
  eatingMet: boolean;
  restDay: boolean;
};

// A day counts toward the streak if it's a claimed rest day, or all
// three areas (strength, movement, eating) were met.
export function isDayMet(c: DayRecord): boolean {
  return c.restDay || (isStrengthMet(c) && c.movementMet && c.eatingMet);
}

// Recomputed from full history every time rather than incrementally
// maintained - avoids "did I already count today" edge cases entirely
// (e.g. correcting an earlier entry the same day). Cheap enough at this
// scale; correctness over micro-optimization.
export function computeCurrentStreak(checkIns: DayRecord[]): number {
  const sorted = [...checkIns].sort((a, b) => b.checkInDate.getTime() - a.checkInDate.getTime());
  let streak = 0;
  let expected = new Date();

  for (const c of sorted) {
    if (!isDayMet(c)) break;

    if (streak === 0) {
      const yesterday = new Date(expected);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      if (!isSameCalendarDay(c.checkInDate, expected) && !isSameCalendarDay(c.checkInDate, yesterday)) {
        break;
      }
    } else if (!isSameCalendarDay(c.checkInDate, expected)) {
      break;
    }

    streak++;
    expected = new Date(c.checkInDate);
    expected.setUTCDate(expected.getUTCDate() - 1);
  }

  return streak;
}

// Eligible once every REST_DAY_INTERVAL_DAYS, floating - not tied to a
// fixed calendar day like "always Sunday".
export function isRestDayEligible(mostRecentRestDay: Date | null, now: Date = new Date()): boolean {
  if (!mostRecentRestDay) return true;
  const daysSince = (now.getTime() - mostRecentRestDay.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince >= REST_DAY_INTERVAL_DAYS;
}
