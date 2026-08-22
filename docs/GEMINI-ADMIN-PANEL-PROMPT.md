# Gemini: build an admin panel for managing the sign-in allowlist

Read this in full before touching anything. droppdd now runs on a real
public domain (`droppdd.alwaysgivealwaysget.com`) behind Cloudflare Access,
but Cloudflare's own dashboard is currently the *only* way to manage who's
allowed to sign in - see `docs/RUNBOOK-ADD-USER-CLOUDFLARE-ACCESS.md` in
the skyrise repo for how that stopgap works today. This isn't good enough
long-term: it's invisible from the app itself and doesn't belong to droppdd.
This prompt is the real fix - an in-app admin panel, backed by the
database, not a third-party dashboard.

## The current state, exactly as it exists right now

- `prisma/schema.prisma` has an `AllowedEmail` model:
  ```prisma
  model AllowedEmail {
    id    Int    @id @default(autoincrement())
    email String @unique
  }
  ```
  Flat list, no admin/role concept at all. Anyone whose email is in this
  table can sign in; there is currently no distinction between "can sign
  in" and "can manage who else can sign in."
- `src/auth.ts`'s `signIn` callback is the actual gate: on every Google
  sign-in it checks `prisma.allowedEmail.findUnique({ where: { email } })`
  and allows/denies based on whether a row exists. This callback should
  stay the single source of truth for "can sign in" - don't duplicate that
  logic elsewhere.
- `src/proxy.ts` redirects any unauthenticated request to `/signin` for
  every route except `/api`, `/signin`, and static assets. `/admin` will
  already be covered by this - it still needs its *own* additional
  admin-only check on top, since "signed in" and "admin" are different
  things once this ships.
- `src/app/components/Navbar.tsx` renders `navItems` (label, href, icon) in
  both a desktop sidebar and a mobile bottom bar, driven by one shared
  array. It receives `userEmail: string | null` as a prop from
  `src/app/layout.tsx`, which derives it from `await auth()`.
- The wagers page (`src/app/wagers/page.tsx`) is the existing pattern for
  a server action that mutates data: a Zod schema validates form input
  server-side (comment there explains why: client-side `<select>`/input
  constraints are trivially bypassed by posting to the action directly),
  and the action starts with its own `await auth()` + redirect check even
  though the route is already gated by `proxy.ts`. **Follow this same
  defense-in-depth pattern here** - every admin mutation must check
  admin status for itself, not rely solely on the page being gated.
- Visual system: bold, high-contrast, uppercase/italic labels, hard
  drop-shadows, sharp corners (no rounded-full except small accent dots).
  Design tokens already in use throughout: `brand-orange`, `brand-bg`,
  `brand-card`, `brand-border`, `brand-text`, `brand-text-muted`. See
  `Navbar.tsx`'s sidebar for the exact look - active nav items get
  `border-l-4 border-brand-orange text-brand-orange`, inactive get
  `border-transparent text-brand-text-muted`. **Match this system exactly,
  don't introduce a new palette or a softer "admin dashboard" look.**

## What to build

1. **Schema**: add `isAdmin Boolean @default(false)` to `AllowedEmail`.
   Real migration (`prisma migrate dev`), not a manual schema edit.
2. **Seed**: mark `[[SEED_ADMIN_EMAIL - fill in before running]]` as
   `isAdmin: true` in `prisma/seed.ts`, upsert-style (don't wipe existing
   `AllowedEmail` rows, matching how the file already seeds from
   `ALLOWED_EMAILS`).
3. **`/admin` route** (new `src/app/admin/page.tsx`, server component):
   - Load the session via `auth()`. If no session, or the session email
     has no `AllowedEmail` row with `isAdmin: true`, do not render the
     admin UI - redirect away (to `/`, matching how other gated flows in
     this app redirect rather than rendering a "forbidden" page).
   - List every `AllowedEmail` row: email + admin status.
   - Form to add a new email (with an "also make admin" checkbox).
   - Action to remove an email.
   - Action to toggle `isAdmin` on an existing row.
4. **Server actions** for add/remove/toggle, each starting with its own
   session + `isAdmin` check (don't trust the page-level gate alone) and
   Zod-validating the email field. **Hard invariant, enforce it in the
   action itself: never allow the last `isAdmin: true` row to be removed
   or demoted.** Reject the action with a clear message if it would leave
   zero admins - this is a real lockout bug if skipped, not a nice-to-have.
5. **Nav**: add an "ADMIN" item to `Navbar`'s `navItems`, visible only when
   the signed-in user is an admin. This means `Navbar` needs a new
   `isAdmin: boolean` prop, threaded from `layout.tsx` (which will need to
   look up the current session email's `AllowedEmail.isAdmin` alongside
   the existing `auth()` call).

## Explicit non-goals

- Don't touch `Wager`, `Workout`, `Meal`, or `Progress` models or pages.
- Don't change `AllowedEmail.email`'s existing `@unique` constraint.
- Don't touch `proxy.ts`'s matcher/redirect logic - `/admin` relies on it
  for the base "must be signed in" check same as every other route, and
  adds its own admin check on top, it doesn't replace anything there.
- Don't worry about deploying the migration to staging/production
  databases - that's handled separately after review. Just get it right
  in your own local dev DB.

## Verification - and why this one matters more than usual

You have no browser and cannot visually verify your own work - say so
explicitly in `HANDOFF.md`, same as every prior design prompt. But this
prompt is access-control code, not cosmetic - a bug here doesn't just look
wrong, it can let a non-admin manage who has access, or lock every admin
out permanently. Beyond the usual visual-verification caveat, write a
specific manual test plan into `HANDOFF.md`: exact steps to (a) confirm a
non-admin signed-in user gets redirected away from `/admin` and gets
rejected if they call the server actions directly, and (b) confirm the
last-admin removal/demotion is actually blocked. I'll run that test plan
directly before this ships anywhere.

## Constraints

- New branch: `git checkout -b feature/admin-panel`.
- Commit locally. **Do not push, do not open a PR.**
- Append a dated `HANDOFF.md` section: what you built, the manual test
  plan described above, and the visual-verification caveat.

## Process

1. `git checkout -b feature/admin-panel`
2. Read `prisma/schema.prisma`, `src/auth.ts`, `src/proxy.ts`,
   `src/app/components/Navbar.tsx`, `src/app/layout.tsx`, and
   `src/app/wagers/page.tsx` in full before changing anything.
3. Add the schema field + migration + seed update.
4. Build `/admin` and its server actions per the spec above.
5. Wire the nav item + `isAdmin` prop threading.
6. Commit locally on `feature/admin-panel`, don't push.
7. Append the dated `HANDOFF.md` section with the manual test plan.
