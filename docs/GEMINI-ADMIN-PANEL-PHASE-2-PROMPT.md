# Gemini: extend the admin panel - catalog management + read-only user visibility

Read this in full before touching anything. The admin panel itself already
shipped (`src/app/admin/`, see `HANDOFF.md`'s "Admin Panel for Managing
Sign-in Allowlist" entry) - allowlist management is done and out of scope
here. This phase adds two more admin capabilities, aligned on directly with
the maintainer beforehand:

1. **Global catalog management** for `Workout` and `Meal` - currently the
   *only* way either gets created or changed is editing `src/lib/mock-data.ts`
   and rerunning the seed script. There is no in-app management at all,
   for anyone.
2. **Read-only visibility into other users' data** (`Progress`,
   `WeightRecord`, `Wager`) for admins - for development/troubleshooting.
   **This must be built as a clearly separate, standalone view - not by
   adding role checks into the existing `/progress` or `/wagers` pages.**
   The maintainer was explicit about this: the ability to see other users'
   data must stay trivially reversible later (deleting one route, not
   auditing conditionals scattered through the app) if the decision changes
   in the future. Read-only - no editing another user's data in this phase.

## Current state, exactly as it exists right now

- `prisma/schema.prisma`:
  ```prisma
  model Workout {
    id           String     @id
    title        String
    description  String
    duration     String
    intensity    String
    category     String
    target       String
    caloriesBurn Int
    exercises    Exercise[]
  }
  model Exercise {
    id        Int      @id @default(autoincrement())
    name      String
    sets      Int
    reps      String
    rest      String
    notes     String?
    workoutId String
    workout   Workout  @relation(fields: [workoutId], references: [id])
  }
  model Meal {
    id           String   @id
    title        String
    description  String
    calories     Int
    protein      Int
    fat          Int
    netCarbs     Int
    category     String
    ingredients  Json
    instructions Json
  }
  ```
  `Workout.id` and `Meal.id` are kebab-case slugs derived from the title
  (e.g. `hellfire-metcon`, `beast-feast`) - not autoincrement, not cuid.
  Match this convention for anything created through the admin UI: slugify
  the title, and handle the collision case (append a numeric suffix or
  reject with a clear error - your call, just handle it).
  `Workout.intensity` is conventionally one of `"HIGH" | "EXtreme" |
  "ANARCHIC" | "MEDIUM"` and `category` one of `"METCON" | "STRENGTH" |
  "AMRAP" | "ENDURANCE"` (see `src/lib/mock-data.ts`'s TS types) - not
  enforced at the DB level, but validate against these sets with Zod in
  the admin form rather than accepting arbitrary strings.
  `Meal.category` is conventionally `"OMAD FEAST" | "KETO POWER" |
  "REFUEL"` - same treatment.
  `Meal.ingredients`/`instructions` are stored as JSON string arrays.
- `src/app/admin/actions.ts` and `src/app/admin/page.tsx` are the existing
  admin panel - **follow their exact pattern**: every mutating action is a
  `"use server"` function that starts with its own `checkAdmin()` call
  (session lookup + fresh `AllowedEmail.isAdmin` DB check, not cached),
  Zod-validates input, and redirects with `?error=`/`?success=` query
  params that `page.tsx` maps through an `ERROR_MESSAGES`/`SUCCESS_MESSAGES`
  record. Reuse `checkAdmin()` from `src/app/admin/actions.ts` rather than
  reimplementing it.
- `src/app/workouts/page.tsx` and `src/app/meals/page.tsx` are the
  read-only user-facing catalog views - good visual reference for how a
  Workout/Meal card is styled, but **do not modify either file**. The new
  admin catalog UI is a separate `/admin/workouts` and `/admin/meals` (or
  similar), not a role-gated variant of the existing pages.
- `prisma/schema.prisma`'s `User` model has `wagers`, `progress`,
  `weightRecords` relations - this is the real registered-user list (only
  populated for people who've actually signed in via Google), distinct
  from `AllowedEmail` (the sign-in gate list, which may contain emails of
  people who've never actually signed in yet).
- Visual system: same as documented in the first admin panel prompt -
  `brand-orange`/`brand-bg`/`brand-card`/`brand-border`/`brand-text`/
  `brand-text-muted`/`brand-danger`, bold uppercase italic labels,
  `.panel-aggressive` for card containers (see `globals.css`). Match
  `src/app/admin/page.tsx`'s existing look exactly for consistency within
  the admin section itself.

## What to build

### 1. Catalog management

- `/admin/workouts`: list all `Workout` rows (with exercise count). Forms
  to add a new Workout (title, description, duration, intensity, category,
  target, caloriesBurn, plus a repeatable exercise sub-form: name, sets,
  reps, rest, notes) and edit/delete an existing one.
- `/admin/meals`: list all `Meal` rows. Forms to add/edit/delete (title,
  description, calories, protein, fat, netCarbs, category, ingredients
  list, instructions list).
- Server actions in `src/app/admin/actions.ts` (or a new
  `src/app/admin/catalog-actions.ts` if that reads cleaner - your call),
  each starting with `checkAdmin()`, Zod-validated, following the existing
  redirect-with-query-param pattern.
- Add "WORKOUTS" and "MEALS" (or a single "CATALOG") entry point somewhere
  reachable from the existing `/admin` page - your call on exact layout,
  just make it discoverable from there.

### 2. Read-only other-user visibility

- New route, e.g. `/admin/users`: list every real `User` (not
  `AllowedEmail`) - email, name if set, and enough of a summary to be
  useful for troubleshooting (e.g. wager count, has-progress-data
  yes/no).
- Click into a user (e.g. `/admin/users/[id]`): show their `Progress`,
  full `WeightRecord` history, and `Wager` list. **Strictly read-only -
  no forms, no server actions that mutate another user's data anywhere in
  this view.**
- Gate this exactly like the rest of `/admin` - `checkAdmin()` at the top
  of the page (and no other route should ever query another user's
  Progress/WeightRecord/Wager without going through this specific,
  clearly-named admin view).

## Explicit non-goals

- No editing another user's Progress/WeightRecord/Wager in this phase -
  view-only, confirmed with the maintainer directly.
- Don't touch the sign-in allowlist admin UI (`src/app/admin/page.tsx`'s
  existing content, `src/app/admin/actions.ts`'s existing three actions) -
  additive only.
- Don't touch `/progress`, `/wagers`, `/workouts`, `/meals` (the
  user-facing pages) - the admin views are new, separate routes.
- Don't add authentication/authorization logic anywhere except by reusing
  the existing `checkAdmin()` pattern.

## Verification

Same elevated bar as the first admin panel prompt - this is still
access-control-adjacent code (an admin-only view into other people's
personal data is exactly the kind of thing that must not leak to a
non-admin). You have no browser and cannot visually verify - say so
explicitly in `HANDOFF.md`. Write a manual test plan covering: (a) a
non-admin can't reach `/admin/workouts`, `/admin/meals`, or `/admin/users`
directly, and their server actions reject non-admin callers same as the
existing three; (b) the catalog CRUD actually round-trips (add a workout,
confirm it appears on the real `/workouts` page too, since that page reads
from the same table); (c) the user-detail view shows real data for a real
user and has no edit affordances anywhere.

## Constraints

- New branch: `git checkout -b feature/admin-panel-phase-2`.
- Commit locally. **Do not push, do not open a PR.**
- Append a dated `HANDOFF.md` section: what you built, the manual test
  plan, and the visual-verification caveat.

## Process

1. `git checkout -b feature/admin-panel-phase-2`
2. Read `src/app/admin/page.tsx`, `src/app/admin/actions.ts`,
   `src/app/workouts/page.tsx`, `src/app/meals/page.tsx`, and
   `prisma/schema.prisma`'s `Workout`/`Exercise`/`Meal`/`User` models in
   full before changing anything.
3. Build the catalog management routes + actions.
4. Build the read-only user-visibility routes.
5. Commit locally on `feature/admin-panel-phase-2`, don't push.
6. Append the dated `HANDOFF.md` section with the manual test plan.
