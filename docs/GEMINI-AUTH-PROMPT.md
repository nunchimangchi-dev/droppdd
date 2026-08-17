# Gemini CLI task: Google OAuth + allowlist

Paste everything below into Gemini CLI, run from inside `~/Projects/droppdd`
on a fresh branch off `main` (`cd ~/Projects/droppdd && git checkout main &&
git pull && git checkout -b feat/auth && gemini`, then paste this whole
prompt at the first turn).

**Before running this**: confirm PR #1 (`feat/app-shell`, the Prisma/SQLite
data layer) has been merged to `main` first. This prompt assumes `main`
already has the Prisma data layer in place — don't stack this on top of an
unmerged branch.

---

You are working in the `droppdd` repo, on a new branch off `main`, which
already has an app shell (Dashboard, Workouts, Meals, Progress pages) backed
by a Prisma/SQLite database (`prisma/schema.prisma`, `src/lib/prisma.ts`).
Read `prisma/schema.prisma` and skim the five page files under `src/app/`
before doing anything — you're about to gate all of them behind sign-in
without changing what they render. Also check `node_modules/next/dist/docs/`
and `AGENTS.md` before writing App Router middleware or route-handler code —
this Next.js version (16.x) and React 19.2.8 may differ from your training
data, and whichever Auth.js/NextAuth version you install may have Next
16-specific integration notes you don't know from training — check its
current docs/README rather than assuming.

## Prerequisites — do not skip this check

This task requires a Google OAuth client that a human has already created
outside this repo (Google Cloud Console — OAuth consent screen + OAuth
client ID, "Web application" type). The credentials are stored in Bitwarden
as a secure note — **a human needs to pull them from Bitwarden and populate
`.env` themselves before you start**; you have no access to Bitwarden and
should not attempt to invoke the `bw` CLI or ask for a master
password/unlock. Before writing any code, check that `.env` contains
non-empty values for:

- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `AUTH_SECRET` (a random session-signing secret — if this one specifically
  is missing, you may generate one yourself, e.g. `npx auth secret`, and add
  it to `.env`)

If `AUTH_GOOGLE_ID` or `AUTH_GOOGLE_SECRET` is missing or empty, **stop and
report that** instead of inventing placeholder values or trying to proceed
without them — the app cannot authenticate against Google without real
credentials.

(Human note, not yours to verify: the OAuth client's authorized redirect
URIs in Google Cloud Console need to include whatever host this actually
runs on — confirm that's still current before testing sign-in, since it may
only have a localhost URI registered so far.)

## What to build

1. **Add Auth.js (NextAuth) with the Google provider.** Confirm the current
   package name/version compatible with Next.js 16 App Router (check npm
   and the package's own docs — don't assume it's still called `next-auth`
   or that setup matches your training data). Wire it up with the App
   Router route handler pattern (typically `src/app/api/auth/[...nextauth]/route.ts`
   or wherever the current version's docs specify).
2. **Persist auth via Prisma.** Use the framework's Prisma adapter so
   `User`, `Account`, `Session`, and `VerificationToken` tables get added to
   `prisma/schema.prisma` following the adapter's required shape. Generate
   and apply a new migration — don't hand-edit `prisma/dev.db` directly.
3. **Add the allowlist.** Add an `AllowedEmail` model (just an `id` and a
   unique `email` field) to the schema, its own migration, and a seed step.
   In the sign-in callback, only allow sign-in if the Google account's email
   exists in `AllowedEmail` — otherwise deny it. Seed `AllowedEmail` from an
   `ALLOWED_EMAILS` env var (comma-separated) if present in `.env`; if it's
   not set, seed nothing and note that in the handoff (don't hardcode any
   real email address into the seed script or migration).
4. **Gate the app.** Add middleware so every existing route
   (`/`, `/workouts`, `/workouts/[id]`, `/meals`, `/progress`) redirects
   unauthenticated visitors to a sign-in page. Build a minimal sign-in page
   (a "Sign in with Google" button is enough, matching the existing
   high-intensity visual style — check `globals.css` theme tokens, don't
   introduce a different look for this one page). Add a sign-out control
   somewhere in the persistent nav.
5. **Don't touch page content or data-fetching logic.** The five pages
   should render exactly what they render today once a user is signed in —
   this task adds a gate in front of them, it doesn't change what's behind
   it.

## Explicit boundaries — do not cross these

- Don't touch anything outside `~/Projects/droppdd`. Never read from or
  write to `~/Projects/skyrise`.
- Don't commit `.env` or print/log any secret value. `.env*` is already
  gitignored — verify it stays that way.
- **No AI/meal-planning API calls.** The "AI meal planning — coming soon"
  card stays exactly as a placeholder.
- **No deployment changes** — don't touch systemd, Tailscale, or hosting
  config of any kind.
- Don't modify `.github/workflows/ci.yml` unless the build genuinely breaks
  without a change there (e.g. CI needs `AUTH_SECRET` as a dummy env var to
  build) — if so, make the minimal change and call it out clearly in the
  handoff.
- Don't add sign-up/self-registration flows or any provider besides Google.
- Work on a new branch (e.g. `feat/auth`), not `main`. Commit locally with
  clear, conventional commit messages as you go. **Do not `git push`. Do
  not open a PR.** Leave the branch local and unpushed — a separate review
  pass picks this up from here.

## Before you finish

Run `npm run lint` and `npm run build` yourself and fix anything they flag.
Then run `npm run dev` and, using your own judgment/tools, confirm: (a) an
unauthenticated request to `/` (or any page) redirects to sign-in rather
than rendering data, and (b) the app fails clearly (not silently) if
`AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` are unset, rather than starting in a
half-broken state. You won't be able to complete a real Google sign-in
end-to-end without a browser session — that's fine, note it as unverified
in the handoff rather than claiming you tested it.

## Handoff

Update `HANDOFF.md` at the repo root — don't overwrite the existing
sections, append a new one for this pass covering:

- What changed (schema additions/migrations, new routes/middleware, which
  package you used for auth and why).
- The allowlist mechanism and how to add an allowed email post-launch
  (Prisma Studio, a script, whatever you set up).
- Exactly which `.env` variables are now required, with a one-line
  description of each (no real values).
- The exact commands you ran to verify, and confirmation they passed (lint,
  build, the redirect-when-signed-out check). Call out explicitly that a
  real end-to-end Google sign-in was **not** verified by you and needs a
  human with a browser to confirm.
- Anything a reviewer should know before deploying this (e.g. the Google
  OAuth client's authorized redirect URIs need to include the real
  production URL, not just localhost).

Then stop. Don't start on AI integration or deployment.
