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

// Pure, no I/O - caller is responsible for persisting the result.
export function evaluateWager(
  wager: WagerLike,
  progress: ProgressLike | null,
  now: Date
): WagerStatus {
  if (progress) {
    if (wager.metric === "WEIGHT_TARGET") {
      const isLossGoal = wager.targetValue < wager.startValue;
      const hit = isLossGoal
        ? progress.currentWeight <= wager.targetValue
        : progress.currentWeight >= wager.targetValue;
      if (hit) return "WON";
    } else if (wager.metric === "STREAK_TARGET") {
      if (progress.currentStreak >= wager.targetValue) return "WON";
    }
  }

  if (now > wager.endDate) return "LOST";

  return "ACTIVE";
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
