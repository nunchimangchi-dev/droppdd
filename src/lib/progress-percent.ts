// Single source of truth for "% toward goal" - used by /progress (per
// historical weigh-in) and /leaderboard (current standing). Previously
// hand-copy-pasted in both places (leaderboard's own comment claimed to
// "reuse the exact formula" but wasn't actually importing anything - a
// real drift risk, now closed).
export function computeGoalPercent(startWeight: number, currentWeight: number, targetWeight: number): number {
  // A maintenance goal (target === start) has zero distance to travel -
  // by definition there's nothing left to close, so this is 100%, not a
  // division by zero. Without this guard the formula below produces NaN.
  if (startWeight === targetWeight) return 100;

  const percentage = ((startWeight - currentWeight) / (startWeight - targetWeight)) * 105;
  return Math.min(Math.max(percentage, 5), 100);
}
