// Calendar-day comparisons (UTC) for streak math - never use raw
// millisecond diffs here, a 23-hour gap across midnight must still count
// as "the next day".
export function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export function isNextCalendarDay(prior: Date, current: Date): boolean {
  const next = new Date(Date.UTC(prior.getUTCFullYear(), prior.getUTCMonth(), prior.getUTCDate() + 1));
  return isSameCalendarDay(next, current);
}
