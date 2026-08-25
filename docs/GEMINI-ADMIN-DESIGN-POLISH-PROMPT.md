# Gemini: design polish pass on the admin panel

Read this in full before touching anything. This is **not** a corrective
redesign like unbrokerrdd's three passes - droppdd already has a real,
accepted visual system (the "bold high-contrast" pass, see `HANDOFF.md`),
and the admin panel (`src/app/admin/`) was already built to match it -
`brand-orange`/`brand-bg`/`brand-card`/`brand-border`/`brand-text`, the
`.panel-aggressive` card pattern, uppercase italic labels. That part's
fine, don't touch it.

What's genuinely unpolished: the admin panel was built in two passes
focused on functional and access-control correctness (see both prior
`HANDOFF.md` entries), not on interaction polish for its more complex UI -
specifically the dynamic, repeatable-field forms and the dense read-only
data view. This pass is about finishing that, cosmetically and
interaction-wise only.

## Current state, exactly as it exists right now

- `src/app/admin/workouts/WorkoutForm.tsx`: a client component with a
  repeatable `exercises` array (name/sets/reps/rest/notes per row), add/
  remove handled via plain `useState` array mutation. No visual distinction
  between exercise rows beyond whatever default spacing exists - look at
  the actual rendered markup below the state declarations before deciding
  what's actually missing (a numbered/lettered row indicator? clearer
  add/remove button treatment? better empty-state framing for a fresh
  workout with one blank exercise row?).
- `src/app/admin/meals/MealForm.tsx`: same shape, for repeatable
  `ingredients` and `instructions` string lists.
- `src/app/admin/users/[id]/page.tsx`: a dense read-only view of one
  user's Progress + full WeightRecord history + Wager list. Read it in
  full - this is the page most likely to just be a wall of data with
  minimal visual hierarchy, since it was built purely for
  troubleshooting utility.
- `src/app/admin/workouts/WorkoutsManager.tsx` and
  `.../meals/MealsManager.tsx`: the list + create/edit/delete
  orchestration components wrapping the forms above.

## What to do

1. Read every file listed above in full, plus `src/app/admin/page.tsx`
   and `src/app/admin/users/page.tsx` for the baseline quality bar
   already set (the hub cards and the operator list are decent reference
   points for "already good" - match that level elsewhere, don't
   reinvent it).
2. Improve the repeatable-field forms (`WorkoutForm`, `MealForm`)
   specifically for clarity when there are many rows: visual separation
   between rows, a clear remove affordance per row, sensible spacing.
   Keep all existing behavior (add/remove/validate/submit) exactly as-is -
   this is presentation only.
3. Improve `admin/users/[id]`'s data density into clearer sections
   (e.g. distinct visual groupings for Progress vs. WeightRecord history
   vs. Wagers) rather than one long undifferentiated list, using the
   existing `.panel-aggressive` pattern to group related data.
4. Cosmetic and structural-markup only - no changes to
   `catalog-actions.ts`, `src/app/admin/actions.ts`, any Zod schemas, or
   any data-fetching logic. Every existing behavior must work identically
   after this pass.

## Explicit non-goals

- Don't touch anything outside `src/app/admin/`.
- Don't touch `src/app/admin/page.tsx`'s existing allowlist-management
  section or the hub cards added in phase 2 - both already match the
  system well.
- Don't add new fields, new validation rules, or new admin capabilities -
  this is a visual/interaction pass on what already exists.

## Verification

Same caveat as every prior prompt: you have no browser and cannot
visually verify your own work - say so explicitly in `HANDOFF.md`.

## Constraints

- New branch: `git checkout -b design/admin-panel-polish`.
- Commit locally. **Do not push, do not open a PR.**
- Append a dated `HANDOFF.md` section: what changed and why, plus the
  visual-verification caveat.

## Process

1. `git checkout -b design/admin-panel-polish`
2. Read every file listed under "Current state" in full.
3. Make the improvements described above.
4. `npm run build` to confirm nothing broke.
5. Commit locally, don't push.
6. Append the dated `HANDOFF.md` section.
