# Future scaling note: additional opt-in habits (sleep, hydration, stretching)

Not a feature spec — a note on when to refactor, written alongside the
Mindfulness module (2026-09-17) so the decision below doesn't get
rediscovered as tech debt later.

## What shipped

Mindfulness is the first opt-in, non-streak-gating daily habit: a single
`Progress.mindfulnessEnabled` boolean (set at onboarding, toggled any time
in profile) and a single `DailyCheckIn.mindfulnessMet` boolean, added as
flat columns — the same shape as `movementMet`/`eatingMet`, not a new
table. It never gates `isDayMet`/the streak; it's a self-reported log,
same spirit as the 6 strength booleans ("we track execution, not define
the activity").

## Why flat columns, not a generic table, for #1

`DailyCheckIn` and `Progress` are already flat, typed columns everywhere
(no JSON blobs for preference data anywhere in this schema). Building a
generic `HabitCheckIn(userId, checkInDate, habitKey, completed)` table to
serve a single boolean would be abstraction with no second caller yet —
the thing this codebase's own conventions argue against (see the `Wager`
schema comment: no metric type gets added until there's real tracked data
to resolve it against).

## When to actually generalize

**Before adding the second opt-in habit** (sleep, hydration, stretching —
whichever is scheduled first), extract a generic habit table. The trigger
isn't column count in the abstract, it's that `isDayMet` (src/lib/checkin.ts)
would otherwise need to branch between *required* booleans (strength,
movement, eating — always gate the streak) and a growing, open-ended set
of *optional* ones (mindfulness, sleep, hydration, ... — never gate it).
That branching logic, not the column count, is the real signal.

At that point:

- Migrate `mindfulnessEnabled`/`mindfulnessMet` (and whatever ships #2)
  into `HabitPreference`/`HabitCheckIn`-shaped tables, with a one-time
  backfill from the existing flat columns.
- Keep the required three (strength/movement/eating) as flat columns on
  `DailyCheckIn` — they're load-bearing for the streak and won't grow in
  number the way optional habits will.
