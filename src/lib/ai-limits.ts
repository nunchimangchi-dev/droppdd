// Hard daily caps on AI meal generation. Each generation is a real,
// billed Anthropic call (claude-haiku-4-5, ~$0.01-0.015 each). The 60s
// cooldown in meals/actions.ts blocks rapid-fire; these bound total daily
// spend regardless of how many users show up.
//
//   per-user cap * count is generous (real use is 1-3/day)
//   global cap fuses worst-case at ~250 * $0.013 = ~$3.25/day
//
// "Day" is a UTC calendar day (see dayStartUtc). Raise these as the beta
// grows and meal planning gets heavier real use.
export const AI_MEAL_DAILY_PER_USER = 15;
export const AI_MEAL_DAILY_GLOBAL = 250;

/** Start of the current UTC calendar day. */
export function dayStartUtc(now: Date = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}
