# Gemini: beta leaderboard - relative metrics only

Read this in full before touching anything. Phase 3 of the beta
expansion (multi-user infra -> AI meal planning -> **this**), deliberately
last since it needs the other two in place to mean anything. Privacy
decision was made explicitly with the maintainer beforehand and is not
up for reinterpretation: the leaderboard shows **relative metrics only**
(% toward goal, streak) - never raw weight or other absolute numbers, for
a small trusted beta group.

## Current state, exactly as it exists right now

- `src/app/progress/page.tsx` line ~67 already computes "% toward goal"
  for one user's own weight history:
  ```ts
  const percentage = ( (progress.startWeight - record.weight) / (progress.startWeight - progress.targetWeight) ) * 105;
  const boundedPercent = Math.min(Math.max(percentage, 5), 100);
  ```
  **Reuse this exact formula** for the leaderboard's ranking (using
  `progress.currentWeight` in place of a specific `record.weight`, since
  the leaderboard shows current standing, not a historical point) -
  don't invent a different calculation.
- `Progress` model: `userId, currentStreak, bestStreak, targetWeight,
  currentWeight, startWeight` - `startWeight`/`currentWeight`/
  `targetWeight` must never be rendered directly on this page, only used
  internally to compute the bounded percentage.
- `User` model has `name` (optional - may be null, Google OAuth doesn't
  always populate it) and `email`. For display identity on the
  leaderboard: use `name` if set, otherwise the local part of `email`
  (everything before `@`) - not the full email address. This is a small
  additional privacy touch beyond the metrics-only rule: identity itself
  (who's on the board) is fine to show for a small trusted group who
  know each other, but there's no reason to show a full email when a
  name or handle does the same job.
- This is a **new page accessible to every signed-in user**, not
  admin-gated - unlike `/admin`, a leaderboard only works if everyone in
  the beta can see it. Add a real nav entry (see
  `src/app/components/Navbar.tsx`'s existing `navItems` array and how
  `layout.tsx` threads props like `isAdmin`/`currentStreak` into it - a
  leaderboard link doesn't need conditional visibility, just add it to
  the array like the existing WORKOUTS/MEALS/PROGRESS/WAGERS entries).

## What to build

1. New route (e.g. `/leaderboard`) - server component, gated the same
   way every other route already is (proxy.ts handles "must be signed
   in"; no additional role check needed, any signed-in user can view).
2. Query every `User` with a `Progress` row, compute the bounded
   percentage per user using the exact formula above, sort descending
   (highest % toward goal first). Include `currentStreak` as a secondary
   displayed stat.
3. Display: rank, display name (per the name/email-prefix rule above),
   percentage, streak. **Do not display** `currentWeight`, `startWeight`,
   `targetWeight`, or full `email` anywhere on this page.
4. Highlight the current signed-in user's own row distinctly (they should
   be able to find themselves at a glance) - a border/background
   treatment consistent with existing active-state patterns elsewhere in
   this app (e.g. `Navbar.tsx`'s active nav-item styling), not a new
   pattern.
5. Empty/sparse state: with few real users, the page should still render
   sensibly (not break on 1 user, not break on 0 users with a Progress
   row) - a plain "not enough operators yet" style message for the
   zero-or-one case is fine, matching this app's existing tone.

## Explicit non-goals

- No new Prisma models or fields - this reads existing data, computes
  in-memory, nothing persisted.
- Don't touch `/progress`, `/admin`, `/meals`, `/onboarding`, or
  `/wagers` - purely additive.
- Don't add opt-out/opt-in controls for appearing on the leaderboard -
  out of scope for this pass (every beta user with a Progress row
  appears; if that needs to change later, that's a separate decision).

## Verification

You have no browser and cannot visually verify - say so explicitly in
`HANDOFF.md`, same as every prior prompt. Manual test plan should
specifically cover: confirm no raw weight value or full email address
appears anywhere in the rendered output (grep the component for
`currentWeight`/`startWeight`/`targetWeight`/`\.email\b` usage outside
the internal percentage calculation to self-check this before calling it
done), and confirm the percentage calculation matches `/progress`'s
existing formula exactly rather than a reimplementation that could drift.

## Constraints

- New branch: `git checkout -b feature/leaderboard`.
- Commit locally. **Do not push, do not open a PR.**
- Append a dated `HANDOFF.md` section: what was built, the
  privacy-relevant design choices restated in your own words, the manual
  test plan, and the visual-verification caveat.

## Process

1. `git checkout -b feature/leaderboard`
2. Read `src/app/progress/page.tsx`, `prisma/schema.prisma`'s `User` and
   `Progress` models, `src/app/components/Navbar.tsx`, and
   `src/app/layout.tsx` in full before changing anything.
3. Build the leaderboard route and query logic.
4. Add the nav entry.
5. Self-check for accidental raw-metric/full-email exposure before
   committing.
6. Commit locally on `feature/leaderboard`, don't push.
7. Append the dated `HANDOFF.md` section.
