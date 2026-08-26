// Deterministic "pick of the day" - same pick for every user on a given
// calendar day, rotates to the next one tomorrow. No new schema/tracking
// needed, just a stable offset derived from the date.
export function dayOfYearOffset(count: number, date: Date = new Date()): number {
  if (count <= 0) return 0;
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const diff = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return dayOfYear % count;
}
