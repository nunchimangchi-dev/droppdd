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
  - **Update — real end-to-end Google sign-in now verified.** Tested via
    browser automation against a connected Mac's Chrome, hitting the actual
    `tailscale serve` production URL (`https://box.tail2b3f17.ts.net/`,
    temporarily pointed at droppdd instead of the dashboard for the test,
    restored afterward). Full flow confirmed: sign-in creates real
    `User`/`Account`/`Session` rows, the allowlist correctly gates
    non-allowed emails, the dashboard renders authenticated, and sign-out
    correctly deletes the session and re-gates the app.
  - **Real bug found and fixed during that test**: `AUTH_TRUST_HOST=true`
    alone was **not sufficient** behind `tailscale serve`. The first leg
    (building the Google authorize URL) correctly picked up the real host,
    but the server-side token-exchange step reconstructed the redirect URI
    as `localhost:3000`, and Google rejected the exchange with
    `redirect_uri_mismatch`. Auth.js's documented fix for self-hosted
    deployments behind a proxy is to set `AUTH_URL` explicitly — confirmed
    this resolves it.
  - **Important**: `AUTH_URL` must **not** live in the shared dev `.env`.
    If hardcoded there, it forces every environment (including plain
    `npm run dev` on `http://localhost:3000`) to use the production
    redirect URI, breaking local sign-in testing entirely (mismatch
    against the *other* registered URI). It needs to be set only in
    whatever environment actually serves the app in production — e.g. a
    `systemd --user` service's `Environment=` directive once droppdd gets
    one (same pattern as the skyrise dashboard), not in this repo's `.env`.
    Left unset here on purpose; whoever sets up the real deployment needs
    to add `AUTH_URL="https://box.tail2b3f17.ts.net"` (or whatever the
    final host is) at that layer.
  - Also fixed during this test: `signIn("google")` had no explicit
    `redirectTo`, so a successful sign-in landed back on `/signin` instead
    of the dashboard (confusing, not a security issue — the session was
    valid the whole time). Now calls `signIn("google", { redirectTo: "/" })`.
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
    - Google notes propagation can take up to a few hours.
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

    # Handoff: Cosmetic Design Pass (feat/design-pass)

    - **Goal**: Refine the visual energy of the app to match the "aggressive fitness" theme and resolve mobile navigation crowding.
    - **What Changed**:
    - **Mobile Navigation Redesign**:
    - Relocated "Sign out" (now "Exit") from the crowded bottom nav to the mobile top header.
    - Updated `src/app/layout.tsx` to include the sign-out button next to the streak badge in the mobile header.
    - Updated `src/app/components/Navbar.tsx` to remove the 5th item, giving the remaining 4 items (Dashboard, Workouts, Meals, Progress) more breathing room and better visual weighting (including a subtle "glow" for active icons).
    - **Sign-in Page Transformation**:
    - Redesigned `src/app/signin/page.tsx` from a bare box to a high-intensity "Operational Access" portal.
    - Added a textured background (diagonal orange stripes), a brutalist-style card with sharp shadows, and improved typography (skewed italic headers, tracking-heavy labels).
    - CSS-only treatment; no new dependencies or client-side JS added.
    - **General Consistency & Hierarchy Pass**:
    - **Sidebar Footer**: Refined the desktop sidebar footer in `Navbar.tsx`. Added better spacing, separated the streak block with a distinct background, and changed the sign-out link to "TERMINATE SESSION" with more visual weight.
    - **Page Headers**: Updated the headers for Dashboard (`/`), Workouts (`/workouts`), and Meals (`/meals`) to be more aggressive (larger, skewed italics, border accents, and decorative SVG background patterns).
    - **Dashboard WOD Card**: Refined the "Combat Lineup" section for better clarity and visual punch.
    - **Verification**:
    - `npm run lint`: Passed.
    - `npm run build`: Passed (Next.js 16.x Turbopack).
    - **Note for Reviewer**:
    - Visual appearance was not verified in a browser (no GUI access). Changes were made based on existing theme tokens and project instructions. Human review with a browser is required for final aesthetic validation.
    - No functional, data, or auth logic was touched.

## Human review (browser-verified)

Reviewed live against the actual `tailscale serve` production URL (temporarily pointed at droppdd, restored to the dashboard afterward), signed in for real to check the authenticated pages. Overall: strong pass — the sign-in page redesign, page headers, and mobile nav relocation all read well and match the app's tone.

One real bug found and fixed: the Dashboard WOD card's "Combat Lineup" rendered `{ex.sets} SETS × {ex.reps} REPS`, but `reps` in the mock data already includes the word ("20 reps", "8 reps @ 80% 1RM") — so it displayed as "4 SETS × 20 REPS REPS". Dropped the trailing literal " REPS" in `src/app/page.tsx`; the equivalent list on `/workouts` was never affected (it doesn't append a suffix).

Confirmed via DOM inspection: the mobile top-header sign-out button is real and wired (icon-only, `title="Sign out"`, posts to the current page). Confirmed the "AI Tactical Nutrition" mock panel on `/meals` predates this pass (from the original app-shell build) — this pass only touched that page's header, scope stayed cosmetic-only as instructed.

`npm run lint` and `npm run build` re-verified clean with the fix included.

# Handoff: Persistent Deployment (feat/deploy)

- **Status**: Done. Implemented directly (not via gemini) — this is host
  config more than repo code, and `docs/GEMINI-DEPLOY-PROMPT.md` exists if
  a future pass needs to redo any of this, but there was no reason to
  route it through an extra interactive-gemini round trip for what's
  mostly `systemctl`/`tailscale` commands.
- **What changed**:
  - `~/.config/systemd/user/droppdd.service` — new unit, `WorkingDirectory`
    `%h/Projects/droppdd`, `ExecStart=/usr/bin/npm run start -- -p 3001`
    (absolute path to `npm`, not relying on systemd's default PATH resolving
    it — verified `/usr/bin/npm` is already on that PATH, but used the
    absolute path anyway for the same reason the deploy prompt called out:
    this exact "works interactively, breaks under systemd" class of bug has
    bitten CI here twice already). `Restart=on-failure`,
    `WantedBy=default.target`. Enabled via `systemctl --user enable --now`;
    confirmed `Linger=yes` was already set (from the dashboard's setup), so
    it survives a reboot without a login session.
  - `Environment=AUTH_URL=https://box.tail2b3f17.ts.net:8443/api/auth` set
    in the unit itself — **not** in the shared dev `.env`, exactly per the
    warning in the auth-phase section above (a hardcoded `AUTH_URL` there
    would break local `localhost:3000` testing).
  - `tailscale serve --bg --https=8443 3001` — droppdd now has its own
    permanent tailnet slot on port 8443, separate from the dashboard's
    default-443 root on 8787. Both coexist; verified with `tailscale serve
    status` showing both mappings simultaneously.
  - The Google OAuth client's authorized redirect URIs already included
    `https://box.tail2b3f17.ts.net:8443/api/auth/callback/google` (added
    ahead of time before this pass, specifically so it wouldn't be a
    mid-task blocker).
- **Verification performed**:
  - `npm run build` clean before wiring up the service.
  - `systemctl --user status droppdd` — active, running.
  - `curl http://127.0.0.1:3001/` → `307` to the correct `:8443` host
    (confirms the `AUTH_URL` env var is actually being read).
  - `tailscale serve status` → both the dashboard (443→8787) and droppdd
    (8443→3001) mappings present at once; dashboard re-confirmed still
    `200` afterward.
  - `curl https://box.tail2b3f17.ts.net:8443/api/auth/providers` → returns
    the Google provider with `callbackUrl` matching exactly what's
    registered in Cloud Console.
  - **Real end-to-end Google sign-in verified live** against the deployed
    `:8443` URL (browser automation on a connected Mac): dashboard rendered
    authenticated, sign-out correctly cleared the session. One automation
    hiccup along the way — coordinate-based clicks on the sign-in button
    intermittently missed (viewport size appears to have shifted mid-session
    on the remote browser); switched to a direct JS `.click()` and it
    worked immediately. Checked the button's actual `getBoundingClientRect()`
    and computed transforms afterward to rule out a real hit-box bug from
    the design pass's CSS — none found, it was an automation-environment
    artifact, not an app bug.
- **Redeploy procedure for future code changes**: pull latest `main`,
  `npm run build`, `systemctl --user restart droppdd`. The unit does not
  rebuild on its own (deliberately — a build step inside `ExecStart` would
  slow every restart/crash-recovery cycle).
- **Known limitation**: `AUTH_URL` is hardcoded to
  `box.tail2b3f17.ts.net:8443`. If the deployment ever moves off this host
  or off Tailscale, that env var (and the registered OAuth redirect URI)
  both need updating together.

# Handoff: Wagers Data Model (feat/wagers-data-model)

- **Status**: Data model only. No UI, no creation flow, no resolution
  logic/cron job. This is deliberately the first, smallest step — a
  checkpoint to review the schema before building anything on top of it.
- **What changed**: New `Wager` model in `prisma/schema.prisma` (migration
  `20260818180525_add_wager_model`), plus a `wagers Wager[]` back-relation
  on `User`.
- **Design decisions, per `docs/FUTURE-WAGERS.md`'s phase-1 scope** (solo
  commitment contracts, honor system, no real money):
  - `metric` is a plain `String`, deliberately limited for now to values
    resolvable against data this schema *already* tracks — no new logging
    infrastructure added just to support a wager type:
    - `WEIGHT_TARGET` — resolves against `WeightRecord` / `Progress.currentWeight`
    - `STREAK_TARGET` — resolves against `Progress.currentStreak`
    A workout-frequency or meal-adherence metric would need a real
    completion-logging table first (none exists yet — `WorkoutTracker`'s
    set-completion state is client-side only); out of scope until that
    exists.
  - `stakeDescription` is a free-text string, not a currency amount — e.g.
    "$20 to Feeding America if I miss this." Honor-system and symbolic by
    design in phase 1; no payment processing anywhere near this yet.
  - `startValue` is captured at creation time (baseline weight or streak),
    so resolution later is a simple comparison, not a re-derivation.
  - `userId` + relation to `User` added now even though only one
    allowlisted user exists today — phase 2 (peer wagers) needs to know
    who made a wager, and retrofitting a required relation onto existing
    rows later is more painful than adding it now while the table's empty.
  - Enum-shaped fields (`metric`, `status`) use plain `String`, matching
    this schema's existing convention (`Workout.intensity`,
    `Workout.category`) rather than introducing Prisma's `enum` — this
    repo has never used Prisma enums, presumably because of SQLite's
    historically limited enum support in Prisma; not worth being the first
    exception here.
  - **Not enforced at the schema level, flagged for whoever builds the
    creation flow next**: the goal-aggressiveness guardrail from
    `docs/FUTURE-WAGERS.md` (capping how aggressive a `WEIGHT_TARGET` can
    be for its date range, roughly 0.5–1% body weight/week) is an
    application-layer validation concern, not something SQLite/Prisma can
    express as a schema constraint.
- **Verification**: `npm run lint` and `npm run build` clean. Confirmed the
  model resolves correctly at the client level (`prisma.wager.findMany()`
  returns `[]`, `User` ↔ `Wager` relation query works).
- **Next steps, not started**: creation form/server action (with the
  aggressiveness guardrail enforced there), a resolution check (likely
  triggered on page load rather than a cron, given this is a
  single-instance personal deployment), and a `/wagers` page to actually
  see them.

# Handoff: Bold High-Contrast Visual Design Overhaul (feat/design-pass-2) - August 19, 2026

- **Goal**: Implement a custom, bold, aggressive "high-contrast brutalist" visual design system across the application and create a high-stakes, Beeminder-inspired visual aesthetic for the `/wagers` page.
- **What Changed**:
  - **Design System Formulation (`globals.css`)**:
    - Discarded the default white/black system duality in favor of a dark-only, high-contrast, premium fitness brand aesthetic (inspired by Gymshark, WHOOP, Kill Crew, and Darc Sport). Enforced matte black (`#050505`) as the base background.
    - Defined custom CSS variables for cohesive brand colors: deep base backgrounds, border shades, text shades, high-voltage warning orange (`#ff5400`), safe green (`#00ff66`), warning yellow (`#ffb800`), and alert/danger red (`#ff3333`).
    - Configured `@theme inline` to map these properties cleanly to Tailwind v4 theme tokens.
    - Added global, highly reusable brutalist utility classes:
      - `.panel-aggressive`: Deep, flat card background with distinct 1px borders and subtle hover state transformation.
      - `.btn-assault`: Slanted, high-contrast primary action button utilizing a `-skew-x-4` transform, black tracking-wide text, and high-voltage orange background.
      - `.hazard-stripes`: Custom `repeating-linear-gradient` representing urgency, risk, and active stakes.
      - `.heading-mega`: Skewed, massive italic headers.
      - `.label-micro`: tracking-widest uppercase metadata labels.
  - **High-Stakes `/wagers` Refactoring (Priority Page)**:
    - Entirely rebuilt the `/wagers` UI using the new components and themes.
    - Replaced generic SaaS tables and rounded elements with sharp `.panel-aggressive` containers.
    - Applied `.hazard-stripes` and warning colors (Warning Yellow, Danger Red) directly to active wagers based on proximity to the end date (inspired by Beeminder's color key indicating buffer remaining), highlighting stakes at risk with high-energy fire indicators.
    - Transformed historical wagers to show stark success states (Safe Green for WON, Danger Red for LOST) using thick, uncompromising custom borders and badges.
    - Cleaned up form inputs and select menus to feature dark inputs with solid borders and focus glowing effects.
  - **System-Wide Token Integration & Page Refactoring**:
    - Cleaned up all pages (`/`, `/meals`, `/progress`, `/workouts`, `/workouts/[id]`, `/signin`, `Navbar.tsx`) by stripping out legacy `bg-white dark:bg-zinc-950` classes, dual-theme `dark:` prefixes, and scattered inline Tailwind color/border strings.
    - Standardized all cards to use `.panel-aggressive`, headings to use `.heading-mega`, subheaders to use `.label-micro`, and primary actions to use `.btn-assault`.
    - Integrated safe-green progress indicators for trend visualization in the `/progress` physical data page.
    - Upgraded the `/signin` screen to utilize the unified `.btn-assault` button and proper brand colors.
    - Aligned `Navbar.tsx` sidebar background, active nav borders, and streak indicators to use the new high-voltage `--accent-volt` token.
- **Key Decisions**:
  - Enforced dark mode by default globally. High-contrast athletic aesthetics rely on deep, aggressive dark colors, so removing light-mode variations ensures a cohesive, high-energy user experience while making the codebase far cleaner and more maintainable.
  - Preserved every single server action, auth callback, data fetching query, and database transaction exactly as they were. No functional or data logic was altered.
- **Verification**:
  - `npm run lint`: Clean pass.
  - `npm run build`: Clean pass. Next.js 16/Turbopack successfully compiled all dynamic pages and middleware routing without any warnings.
- **Note for Reviewer**:
  - Visual appearance was not verified in a browser (no GUI access). Changes were made based on existing theme tokens and project instructions. Human review with a browser is required for final aesthetic validation.


