# Handoff: droppdd App Shell

The `droppdd` app shell is complete, featuring persistent navigation, a dashboard, workout tracker, meals section, and progress tracking.

## Pages Built
- **Dashboard (`/`)**: Today's snapshot (OMAD status, streak, weight trend), WOD card, upcoming meal card.
- **Workouts (`/workouts`)**: List of guided workouts. Detail page (`/workouts/[id]`) with an interactive `WorkoutTracker` including set-completion tracking and rest timer.
- **Meals (`/meals`)**: Mock meal ideas with nutrition info and preparation protocols. Included a placeholder "AI Meal Planning" section.
- **Progress (`/progress`)**: Simple overview of weight history and progress visualization.

## Key Decisions & Assumptions
- **Styling**: Used Tailwind CSS v4 (`@import "tailwindcss"`) with theme tokens in `globals.css` as requested.
- **Mock Data**: Consolidated all data in `src/lib/mock-data.ts`.
- **Responsive Design**: Mobile-first design with a bottom navigation bar for mobile and a sidebar for desktop.
- **Interactivity**: Added client-side state in `WorkoutTracker` for real-time tracking during a workout.
- **State Management**: Used React `useState` and `useEffect` for the rest timer and progress tracking.

## Open Questions for Next Phase
- **Auth**: Need to integrate an authentication provider.
- **Database**: Need to define a schema and select a database to replace mock data.
- **AI Integration**: Need to determine which API to use for the AI-assisted meal planning section.
- **Deployment**: Need to select a deployment target (e.g., Vercel, AWS, etc.).

## Verification
- `npm run lint`: Passed.
- `npm run build`: Passed.

## Branch
- Work performed on branch: `feat/app-shell`.

# Handoff: Data Migration to SQLite (Prisma)

- **What Changed**:
  - Installed Prisma and set up SQLite database.
  - Defined Prisma schema matching `mock-data.ts`.
  - Created a seed script `prisma/seed.ts` to populate the DB with mock data.
  - Updated all page components (`/`, `/workouts`, `/workouts/[id]`, `/meals`, `/progress`) to fetch data from Prisma directly using Server Components.
- **Modeling Decisions**:
  - Used `Json` type for `ingredients` and `instructions` in `Meal` model to maintain flexibility in SQLite.
  - Created separate models for `Workout`, `Exercise`, `Meal`, `Progress`, and `WeightRecord` to align with the data structure.
- **Verification**:
  - Ran `npm run lint` and `npm run build` - both passed.
  - Manually verified all pages display the same data as before.
- **Note for Reviewer**:
  - Added `npx prisma migrate dev` and `npx prisma db seed` to the development workflow.
  - The database file `prisma/dev.db` is ignored in `.gitignore`.

# Handoff: Auth Phase — Done (implemented directly, not via gemini)

- **Status**: Implemented on `feat/auth`. `gemini -p` (headless) turned out
  to be architecturally incapable of running shell/file-write tools at all
  — see the memory note from that investigation — so this pass was done
  directly instead of through `docs/GEMINI-AUTH-PROMPT.md`, following the
  same scope/boundaries that prompt laid out.
- **What changed**:
  - Added `next-auth@5.0.0-beta.32` (Auth.js v5, App Router compatible) and
    `@auth/prisma-adapter@2.11.3`.
  - `prisma/schema.prisma`: added `User`, `Account`, `Session`,
    `VerificationToken` (standard Auth.js Prisma-adapter shape) and
    `AllowedEmail` (`id`, unique `email`). New migration
    `20260817205240_add_auth_and_allowlist`.
  - `src/auth.ts`: `NextAuth()` config — Google provider only, Prisma
    adapter, custom `pages.signIn: "/signin"`, and a `signIn` callback that
    denies sign-in unless the Google account's email exists in
    `AllowedEmail`.
  - `src/app/api/auth/[...nextauth]/route.ts`: route handlers.
  - `src/proxy.ts` — **not** `middleware.ts`. Next.js 16 renamed the
    middleware file convention to `proxy.js`/`proxy.ts`
    (`middleware.js` still works as a no-op deprecated alias in some
    versions, but the docs bundled in `node_modules/next/dist/docs/`
    confirm `proxy.ts` is current for 16.x) — gates every route except
    `/api/*`, `/signin`, and static assets, redirecting unauthenticated
    requests to `/signin`.
  - `src/app/signin/page.tsx`: minimal sign-in page matching the existing
    dark/orange visual style, a single "Sign in with Google" button wired
    to a server action calling `signIn("google")`.
  - `src/app/layout.tsx` + `src/app/components/Navbar.tsx`: layout is now
    an async Server Component that calls `auth()` and passes the session
    email + a `signOut` server action down to `Navbar` (still a Client
    Component, for the nav-highlighting logic). Sign-out control added to
    the desktop sidebar footer and as a 5th mobile bottom-nav item.
  - `prisma/seed.ts`: seeds `AllowedEmail` from `ALLOWED_EMAILS`
    (comma-separated) if set; upserts so re-seeding never wipes entries
    added later by hand. No real email hardcoded anywhere.
  - `.env` gained `AUTH_SECRET` and `AUTH_TRUST_HOST="true"` (the latter
    needed since this runs behind `tailscale serve`, a reverse proxy).
- **Real issue hit and fixed**: `@auth/prisma-adapter` types its argument
  against the standard `@prisma/client` package. This project uses Prisma
  7's custom client output (`generated/prisma`), which is a structurally
  different (but runtime-identical) `PrismaClient` type — caused a build
  type-check failure. Fixed with a narrow, commented `as unknown as
  PrismaClient` cast in `src/auth.ts` rather than loosening anything
  broader.
- **Allowlist mechanism**: post-launch, add an allowed email either by
  setting `ALLOWED_EMAILS` in `.env` and re-running `npx prisma db seed`
  (idempotent), or directly via `npx prisma studio` → `AllowedEmail` table.
- **`.env` variables now required**:
  - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth client
    credentials (Cloud Console → Credentials).
  - `AUTH_SECRET` — session-signing secret (`npx auth secret` to generate).
  - `AUTH_TRUST_HOST` — `"true"`, required behind a reverse proxy.
  - `ALLOWED_EMAILS` — optional, comma-separated, seeds the allowlist.
- **Verification performed**:
  - `npm run lint` — clean.
  - `npm run build` — clean, including with **zero** auth env vars set
    (confirms `next build` doesn't execute the now-fully-dynamic routes at
    build time, so CI needs no changes for this phase — `.github/workflows/ci.yml`
    left untouched, per the original boundary).
  - `npm run dev` + `curl`: unauthenticated `GET /` and `GET /workouts` →
    `307` to `/signin`; `GET /signin` → `200`, not redirected;
    `GET /api/auth/providers` → not gated, returns the Google provider.
  - Missing-credentials behavior tested directly: with only `AUTH_SECRET`
    set (no Google creds), hitting `/api/auth/signin/google` redirects
    cleanly to `/api/auth/error?error=Configuration` — a clear, readable
    error state, not a silent half-broken app.
  - **Not verified**: a real end-to-end Google sign-in. That needs a human
    with a browser — I don't have one on this host (see the Chrome
    install note above; browser automation this session ran against a
    connected Mac, not this machine).
- **Before deploying**: the OAuth client's authorized redirect URIs
  already include both `http://localhost:3000/api/auth/callback/google`
  and `https://box.tail2b3f17.ts.net/api/auth/callback/google` (see the
  entry below on the Tailscale hostname fix) — confirm that's still
  current if the deploy target changes.

**Original prerequisites section (now historical)**:
  - `.env` populated with `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` (pulled
    from the Bitwarden secure note) and a freshly generated `AUTH_SECRET`.
  - The Google OAuth client's authorized redirect URIs now include both
    `http://localhost:3000/api/auth/callback/google` (dev) and
    `https://box.tail2b3f17.ts.net/api/auth/callback/google` (prod, over
    `tailscale serve`, same pattern as the skyrise dashboard). Verified
    saved via a fresh page reload of the Cloud Console client editor.
    Google notes propagation can take up to a few hours.
  - Caveat: this assumes droppdd ends up served at the *root* of
    `box.tail2b3f17.ts.net`. If it lands on a sub-path instead, this
    redirect URI needs updating first.
- **Scope, per the prompt**: Auth.js (NextAuth) with the Google provider
  only, Prisma adapter (adds `User`/`Account`/`Session`/`VerificationToken`
  tables + a migration), plus a new `AllowedEmail` model gating sign-in to
  specific addresses. Middleware protects all existing routes. No AI
  integration, no deployment changes.
- **Since the data-layer merge, two things the auth phase should know
  about**:
  - `package.json` now has a `postinstall: prisma generate` script — the
    generated Prisma client is gitignored and regenerates automatically on
    install. Any new models added for auth just need a migration, not a
    manual generate step.
  - CI (`.github/workflows/ci.yml`) now runs `prisma migrate deploy` and
    `prisma db seed` (with `DATABASE_URL` supplied inline) before
    `npm run build`, because the pages are static and query Prisma at
    build time. This was needed to get PR #1 green — the auth phase will
    need its new migration(s) to apply cleanly under that same flow.
- **Branch plan**: prompt assumes starting from `main` on a fresh
  `feat/auth` branch (PR #1 is merged, so this is unblocked branch-wise —
  only the Bitwarden/`.env` step remains).
