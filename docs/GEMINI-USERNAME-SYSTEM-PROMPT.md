# Gemini: required, unique, changeable usernames

Read this in full before touching anything. This replaces raw
name/email-derived identity across the app with a real username system,
driven by a privacy requirement from the maintainer: every user picks a
unique username (required, not optional cosmetic flourish), can change it
later for a "fresh start" optically, and the app should stop surfacing
full email addresses as identity where a username can do the job instead.
This is phase 1 of a larger sequence (**this** -> peer wagers ->
leaderboard) - the leaderboard was deliberately paused mid-build because
its display-identity logic (name-or-email-prefix) is now obsolete; it
gets rebuilt on top of this once this phase is done.

## Current state, exactly as it exists right now

- `prisma/schema.prisma`'s `User` model has no `username` field at all:
  ```prisma
  model User {
    id            String    @id @default(cuid())
    name          String?
    email         String?   @unique
    emailVerified DateTime?
    image         String?
    accounts      Account[]
    sessions      Session[]
    wagers        Wager[]
    progress      Progress[]
    weightRecords WeightRecord[]
  }
  ```
- **Migration constraint - read carefully, this is the trickiest part of
  this prompt.** This app has real beta users in production right now
  with existing `User` rows and no username set. Adding `username String
  @unique` as a non-nullable column in a single migration will fail (or
  silently force an unsafe default) against existing rows on the sqlite
  datasource. The correct approach, matching a pattern already
  established in this codebase (`src/app/onboarding` gates access until
  a `Progress` row exists):
  - Schema: `username String? @unique` - nullable at the database level.
  - **Application-level enforcement**: any signed-in user with
    `username === null` gets redirected to a "choose your username" page
    before they can use anything else, the exact same gating pattern
    `src/app/onboarding/page.tsx` already uses for missing `Progress`
    (check `session.user.id` -> query `User.username` -> redirect if
    null). This makes it *effectively* required without a risky
    non-nullable migration against real data.
  - This means existing beta users will hit the username-picker on their
    next visit post-deploy. That's expected and fine - say so explicitly
    in `HANDOFF.md`.
- `src/app/onboarding/actions.ts` and `src/app/onboarding/page.tsx` are
  the reference pattern for: session check via `auth()`, Zod validation,
  a `"use server"` action, and a gate page that queries then redirects.
  Follow this shape for the new username-picker page/action, don't
  invent a different structure.
- No `/profile` or `/settings` route exists yet anywhere in `src/app` -
  this prompt creates the first one (needed for changing username later).
- `src/app/components/Navbar.tsx` currently receives and renders a raw
  `userEmail` prop (full email address, `Navbar.tsx` line ~213:
  `<p ...>{userEmail}</p>`), threaded from `src/app/layout.tsx` line ~54:
  `<Navbar userEmail={session?.user?.email ?? null} ... />`. This
  directly undercuts the privacy goal driving this whole prompt - swap
  it for the username once set (fall back to the existing raw-email
  behavior only pre-username, i.e. during the brief window before
  someone has completed the username picker - though in practice the
  gate means this should rarely if ever be visible post-deploy for an
  actual page render).

## What to build

1. **Schema**: add `username String? @unique` to `User` in
   `prisma/schema.prisma`. Run the appropriate Prisma migration command
   for this project (check `package.json` scripts / existing
   `prisma/migrations` folder naming convention and match it - do not
   guess at a different migration tool).
2. **Validation rules** (Zod schema, reused identically by both the
   picker and the later change-username action - don't duplicate the
   rule set):
   - 3-20 characters.
   - Alphanumeric plus underscore only (`^[a-zA-Z0-9_]+$`), no spaces -
     keeps it URL/display safe and simple for a small beta.
   - Trim whitespace before validating.
3. **Uniqueness check**: case-insensitive (so `Dave` and `dave` can't
   both exist and look identical to other users) - use Prisma's
   `mode: "insensitive"` on the lookup query before create/update, but
   **preserve and store the user's own chosen casing** for display (only
   the *comparison* is case-insensitive, not the stored value). If taken,
   return a clear validation error, don't silently append a suffix.
4. **Username picker (new user gate)**: new route (e.g.
   `/choose-username`), server component + `"use server"` action,
   following the onboarding gate pattern:
   - If `session.user.username` already set, redirect away (don't show
     the picker again).
   - Form: single username field, real-time availability isn't required
     (a small beta doesn't need that polish) - server-side validation
     and a clear inline error on collision is enough, matching how
     `onboarding/page.tsx` surfaces `?error=` messages today.
   - On success, set `User.username`, redirect to `/`.
   - This page should be reachable (and users should be forced to it)
     immediately after sign-in / before onboarding if they have no
     username yet - check where the onboarding gate currently lives
     (likely `layout.tsx` or a route-level check) and add the
     username-null check at the same layer, username-picker taking
     priority (a user should pick a username before or alongside setting
     up their `Progress` baseline - your call on exact ordering as long
     as both gates are enforced and don't conflict/loop).
5. **New `/profile` (or `/settings`) route** for changing username later:
   - Server component showing current username, form to change it
     (same Zod schema + case-insensitive uniqueness check as the picker,
     reused not reimplemented).
   - Add a real nav entry to `Navbar.tsx`'s `navItems` array (same
     pattern as WORKOUTS/MEALS/PROGRESS/WAGERS/etc.) so it's actually
     reachable, not just a hidden route.
6. **Navbar identity swap**: change `Navbar.tsx`'s rendering at line
   ~213 to show the username instead of the raw email (thread a new
   `username` prop from `layout.tsx` the same way `currentStreak` and
   `isAdmin` are already threaded in - query `User.username` alongside
   the existing session/progress queries in `layout.tsx`). Keep the
   `userEmail` prop and its fallback rendering only for the (should be
   rare/nonexistent post-gate) case where username is somehow still
   null - don't delete the prop or break the type, just prefer username
   when present.

## Explicit non-goals

- **No avatar work.** The maintainer explicitly called this out as
  "(eventually)" - future, separate phase. Don't add an `image`/avatar
  picker, don't touch the existing `User.image` field beyond what's
  already there.
- **No leaderboard changes.** That's a separate, later phase - don't
  touch anything under a future `/leaderboard` route (it doesn't exist
  yet on `main`).
- **No peer-wager changes.** Also a separate, later phase.
- Don't rename `User.name` or remove it - it's still populated by Google
  OAuth and may still be useful elsewhere; this prompt adds `username`
  alongside it, doesn't replace the field.
- Don't build a "reserved username" blocklist or profanity filter -
  out of scope for a small trusted beta.

## Verification

You have no browser and cannot visually verify - say so explicitly in
`HANDOFF.md`, same as every prior prompt. Manual test plan should
specifically cover: a fresh user with no username gets gated to the
picker before reaching the rest of the app; picking a taken username
(including a case-variant of a taken one, e.g. `DAVE` when `dave`
exists) shows a clear error and doesn't create a duplicate; changing an
existing username via `/profile` succeeds and is reflected immediately
in the Navbar; `npm run build` and `npm run lint` both pass; confirm the
Prisma migration applies cleanly against the existing dev database
without needing to drop/reset it (this must be a safe additive
migration, not a destructive one - flag clearly in `HANDOFF.md` if for
any reason it can't be additive).

## Constraints

- New branch: `git checkout -b feature/username-system`.
- Commit locally. **Do not push, do not open a PR.**
- Append a dated `HANDOFF.md` section: what was built, the
  nullable-schema-plus-application-gate migration strategy restated in
  your own words (this is the part most likely to be gotten wrong -
  explain why a non-nullable column would have been unsafe here), the
  manual test plan, and the visual-verification caveat.

## Process

1. `git checkout -b feature/username-system`
2. Read `prisma/schema.prisma`'s `User` model, `src/app/onboarding/actions.ts`,
   `src/app/onboarding/page.tsx`, `src/app/layout.tsx`, and
   `src/app/components/Navbar.tsx` in full before changing anything.
3. Add the nullable `username` column + migration.
4. Build the Zod schema (shared by picker and profile-change action).
5. Build the username-picker gate route + action.
6. Build the `/profile` route + change-username action, add the nav entry.
7. Thread `username` into `layout.tsx` -> `Navbar.tsx`, swap the identity
   display.
8. Self-check: confirm the gate actually blocks a null-username session
   from reaching other routes, confirm case-insensitive collision
   handling works.
9. Commit locally on `feature/username-system`, don't push.
10. Append the dated `HANDOFF.md` section.
