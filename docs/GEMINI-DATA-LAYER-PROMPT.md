# Gemini CLI task: SQLite data layer

Paste everything below into Gemini CLI, run from inside `~/Projects/droppdd`
on the `feat/app-shell` branch (`cd ~/Projects/droppdd && git checkout
feat/app-shell && gemini`, then paste this whole prompt at the first turn).

---

You are working in the `droppdd` repo, on branch `feat/app-shell`, which
already has an app shell built (Dashboard, Workouts, Meals, Progress pages)
reading from a static mock-data file. Read `src/lib/mock-data.ts` and the
four page files that import it (`src/app/page.tsx`,
`src/app/workouts/page.tsx`, `src/app/workouts/[id]/page.tsx`,
`src/app/meals/page.tsx`, `src/app/progress/page.tsx`) before doing
anything — that's the exact content and shape you're about to migrate into a
real database. Also check `node_modules/next/dist/docs/` and `AGENTS.md`
before writing App Router data-fetching code — this Next.js version (16.x)
may differ from your training data.

## What to build

Replace the static mock-data import with a real, seeded SQLite database.
Content and behavior must stay visually identical — this is purely a data
plumbing change, not a redesign.

1. **Add Prisma + SQLite.** `npm install prisma @prisma/client`, then
   `npx prisma init --datasource-provider sqlite`. The db file should live
   at `prisma/dev.db` and must be gitignored — never commit the binary db
   file, only `prisma/schema.prisma` and migrations.
2. **Model the schema** to match what's currently in `mock-data.ts`:
   workouts (with their ordered exercises as a related table — sets, reps,
   rest, notes), meals (with nutrition info and prep steps), and progress
   entries (date + weight, whatever the progress page currently shows).
   Use your judgment on exact field types/names, but the shape must cover
   everything the current mock data has — don't drop fields.
3. **Seed script** (`prisma/seed.ts`) that inserts the *exact* current mock
   data as rows, so `npx prisma migrate dev` + seed reproduces what's on
   screen today with zero visible difference. Wire it up via the `prisma.seed`
   key in `package.json` so `npx prisma db seed` works.
4. **Update the pages** to fetch from the Prisma client (server components —
   this is Next App Router, pages can be `async` and query directly) instead
   of importing `mock-data.ts`. Leave `WorkoutTracker.tsx`'s client-side
   set-completion/rest-timer state exactly as it is — it just needs the same
   exercise list shape passed in as a prop, nothing about its interactivity
   changes.
5. You can delete `src/lib/mock-data.ts` once nothing imports it anymore, or
   leave it as the seed script's source of truth (import it from
   `prisma/seed.ts` instead of retyping the data) — your call, whichever is
   less error-prone.
6. Update the README's Development section to mention the new setup step
   (`npx prisma migrate dev`, `npx prisma db seed`) needed before
   `npm run dev` works on a fresh clone.

## Explicit boundaries — do not cross these

- Don't touch anything outside `~/Projects/droppdd`. Never read from or
  write to `~/Projects/skyrise`.
- **No auth, no user accounts, no allowlist table yet.** That's a separate
  future pass once a Google OAuth client exists — don't add `User` or
  session-related models now.
- **No AI/meal-planning API calls.** The "AI meal planning — coming soon"
  card stays exactly as a placeholder.
- **No deployment changes** — don't touch systemd, Tailscale, or hosting
  config of any kind.
- Don't modify `.github/workflows/ci.yml` unless the build genuinely breaks
  without a change there (e.g. CI needs a migrate/seed step to build) — if
  so, make the minimal change and call it out clearly in the handoff.
- Stay on branch `feat/app-shell` (it's already checked out, already has
  prior work committed). Commit your changes locally with clear messages as
  you go. **Do not `git push`. Do not open a PR.**

## Before you finish

Run `npm run lint` and `npm run build` yourself and fix anything they flag.
Then run `npm run dev`, and using your own judgement/tools confirm the
Dashboard, Workouts list, a Workout detail page, Meals, and Progress pages
all render the same content they did before this change (spot-check against
what `mock-data.ts` used to contain) — don't hand back a build that's clean
but silently missing data.

## Handoff

Update `HANDOFF.md` at the repo root — don't overwrite the existing app
shell section, append a new one for this pass covering:

- What changed (schema, seed script, which pages now query the DB).
- Any field/shape decisions you made modeling the schema.
- The exact commands you ran to verify, and confirmation they passed
  (lint, build, and the manual page-content spot-check).
- Anything a reviewer should know before adding auth on top of this (e.g.
  if you touched CI, say exactly what and why).

Then stop. Don't start on auth, AI integration, or deployment.
