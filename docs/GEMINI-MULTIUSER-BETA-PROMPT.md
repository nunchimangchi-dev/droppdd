# Gemini: fix real multi-user bugs + self-service onboarding for a 10-slot beta

Read this in full before touching anything. droppdd is moving from
effectively single-real-user to a real 10-person beta. The admin panel
(user allowlist management) already exists and works - this prompt is
about two things that don't: (1) a real data-isolation bug that was
invisible with one user and will actively leak data across users the
moment a second real person signs in, and (2) there's currently no way
for a new user to set up their own starting data at all.

## The bug - confirmed by direct code review, not guessed

`src/app/page.tsx` (the home dashboard) queries:
```ts
const progress = await prisma.progress.findFirst();
```
No `where: { userId }`, and the file never calls `auth()` at all. Every
signed-in user currently sees whichever `Progress` row happens to be
first in the table - not their own. Compare `src/app/progress/page.tsx`
and `src/app/wagers/page.tsx`, which both do this correctly already
(`auth()` for the session, `where: { userId: session.user.id }` on every
per-user query) - use those two files as the reference pattern to bring
`page.tsx` in line with, not something to invent fresh.

Also: `src/app/components/Navbar.tsx` hardcodes `"12 DAYS STRONG"` in the
sidebar/mobile-header streak display (search for `12 DAYS` - it's a
literal string, not pulled from data at all). This was invisible with one
real user coincidentally matching that number early on; it's wrong for
everyone now. It needs the real per-user `currentStreak`, which means
`Navbar` needs that value threaded in as a prop the same way `layout.tsx`
already threads `isAdmin` in - see that existing wiring for the pattern.

## The missing piece - no self-service onboarding exists at all

Today, a new `Progress` row is only ever created by `prisma/seed.ts`
(mock data) or directly in the database. There is no user-facing way to
create one. A newly admin-added beta user who signs in for the first time
will hit `progress/page.tsx`'s existing `if (!progress)` branch and see
"No progress data found." with no path forward - a dead end.

Build a real onboarding flow: when a signed-in user has no `Progress` row,
show a form (name isn't needed - that's already on `User` from Google -
just `currentWeight`, `targetWeight`, `startWeight` from the `Progress`
model) that creates their initial `Progress` row via a server action
(same pattern as every other mutating action in this codebase: Zod
validation, starts by confirming there's a real session, no other user's
data touched). `currentStreak`/`bestStreak` start at 0 - no form field
needed for those. Reasonable validation: weights must be positive
numbers; no opinion needed on whether target must be below current (that
guardrail already exists elsewhere for wagers specifically, not relevant
here).

Decide where this onboarding lives - either its own route (e.g.
`/onboarding`) redirected to when a signed-in user has no Progress row, or
inline on the dashboard/progress page in place of the current dead-end
message. Your call, but it must be reachable - a user should never see a
bare "no progress data" wall with no way through it.

## Beta capacity - visible, not enforced as a hard block

Add a slot counter to the existing admin panel (`src/app/admin/page.tsx`)
showing how many non-admin `AllowedEmail` rows exist out of 10 (e.g.
"7 / 10 beta slots used"). Soft warning only if adding an 11th would
exceed it (e.g. a confirmation-style message, not a hard rejection) -
this is a marketing/product framing device ("10 slots"), not a real
technical constraint, so don't block the admin from overriding it if they
want to.

## Explicit non-goals

- No leaderboard work - that's a later, separate prompt, deliberately
  sequenced after this.
- No AI meal-planning work - also later, separate.
- Don't touch `wagers/page.tsx` or `progress/page.tsx`'s existing
  correct per-user scoping - they're already right, used as the
  reference pattern above.
- Don't change the `Progress` schema (no new fields) - this is a bug fix
  and a missing-flow fix, not new data modeling.

## Verification

You have no browser and cannot visually verify - say so explicitly in
`HANDOFF.md`, same as every prior prompt. This one is a real data-leak
bug fix, so be specific in the manual test plan about how to confirm it:
with two different real `User` rows each having their own `Progress` row,
confirm `/` (the home dashboard) shows each user their own data, not each
other's or whichever loaded first. Also confirm a brand-new user (a
`User` row with zero `Progress` rows) reaches the onboarding flow instead
of a dead end, and that submitting it correctly creates a `Progress` row
scoped to their own `userId`.

## Constraints

- New branch: `git checkout -b feature/multiuser-beta`.
- Commit locally. **Do not push, do not open a PR.**
- Append a dated `HANDOFF.md` section: what was fixed/built, the manual
  test plan above, and the visual-verification caveat.

## Process

1. `git checkout -b feature/multiuser-beta`
2. Read `src/app/page.tsx`, `src/app/progress/page.tsx`,
   `src/app/wagers/page.tsx`, `src/app/components/Navbar.tsx`,
   `src/app/layout.tsx`, and `src/app/admin/page.tsx` in full before
   changing anything.
3. Fix the `page.tsx` per-user scoping bug and the `Navbar.tsx` hardcoded
   streak, following the existing correct patterns exactly.
4. Build the onboarding flow.
5. Add the beta-slot counter to the admin panel.
6. Commit locally on `feature/multiuser-beta`, don't push.
7. Append the dated `HANDOFF.md` section with the manual test plan.
