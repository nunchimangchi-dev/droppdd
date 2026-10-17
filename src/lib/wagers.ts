export type WagerStatus = "ACTIVE" | "WON" | "LOST" | "CANCELLED";

interface WagerLike {
  metric: string; // "WEIGHT_TARGET" | "STREAK_TARGET"
  startValue: number;
  targetValue: number;
  endDate: Date;
}

interface ProgressLike {
  currentWeight: number;
  currentStreak: number;
}

// The chosen end date is inclusive: a wager ending on a given date can still
// be won any time on that UTC calendar day. The deadline is therefore the
// first instant after that day (the end date arrives as midnight UTC).
export function wagerDeadline(endDate: Date): Date {
  return new Date(
    Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate() + 1)
  );
}

function targetHit(wager: WagerLike, progress: ProgressLike | null): boolean {
  if (!progress) return false;
  if (wager.metric === "WEIGHT_TARGET") {
    const isLossGoal = wager.targetValue < wager.startValue;
    return isLossGoal
      ? progress.currentWeight <= wager.targetValue
      : progress.currentWeight >= wager.targetValue;
  }
  if (wager.metric === "STREAK_TARGET") return progress.currentStreak >= wager.targetValue;
  return false;
}

// Pure, no I/O - caller is responsible for persisting the result.
//
// Before the deadline the wager is judged on `progress` (current standing).
// After it, today's standing no longer counts: a target reached late must not
// win. The caller passes `atDeadline`, what was true by the deadline (see
// src/lib/resolve-wagers.ts), and with none the wager is LOST.
export function evaluateWager(
  wager: WagerLike,
  progress: ProgressLike | null,
  now: Date,
  atDeadline: ProgressLike | null = null
): WagerStatus {
  if (now.getTime() < wagerDeadline(wager.endDate).getTime()) {
    return targetHit(wager, progress) ? "WON" : "ACTIVE";
  }
  return targetHit(wager, atDeadline) ? "WON" : "LOST";
}

export function formatMetricValue(metric: string, value: number): string {
  return metric === "WEIGHT_TARGET" ? `${value} LBS` : `${value} DAYS`;
}

// %-bodyweight/week implied by moving from startValue to targetValue over
// the given window. Only meaningful for WEIGHT_TARGET loss goals - callers
// should only apply the safety cap in that case (see docs/FUTURE-WAGERS.md).
export function impliedWeeklyRatePercent(
  startValue: number,
  targetValue: number,
  startDate: Date,
  endDate: Date
): number {
  const weeks = Math.max(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7),
    1 / 7 // floor at a day so a same-day endDate doesn't divide by ~0
  );
  const percentChange = (Math.abs(startValue - targetValue) / startValue) * 100;
  return percentChange / weeks;
}
