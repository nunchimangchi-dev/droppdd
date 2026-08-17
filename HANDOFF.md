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

# Handoff: Auth Phase — Ready to Run

- **Status**: Prompt drafted (`docs/GEMINI-AUTH-PROMPT.md`), not yet run.
  No auth code exists on `main` yet. Prerequisites are now cleared —
  unblocked, ready for a `gemini -p` pass.
- **Prerequisites — done**:
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
