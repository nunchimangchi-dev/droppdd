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

# Handoff: Admin Panel for Managing Sign-in Allowlist (feature/admin-panel) - August 21, 2026

## What was built
- **Schema Migration (`prisma/schema.prisma` & migrations)**:
  - Added `isAdmin Boolean @default(false)` to the `AllowedEmail` model.
  - Generated and executed a real SQLite schema migration `20260822032601_add_is_admin_to_allowed_email` using `prisma migrate dev`.
  - Regenerated the Prisma Client types to expose the `isAdmin` property.
- **Upsert-Style Database Seeding (`prisma/seed.ts`)**:
  - Enhanced the database seed script to read from `process.env.SEED_ADMIN_EMAIL`.
  - If specified, it upserts the given email into the allowlist and marks them as `isAdmin: true` while preserving any existing entries (zero-disruption approach).
- **Secure Server Actions (`src/app/admin/actions.ts`)**:
  - Created a set of Server Actions with strict validation and defense-in-depth security:
    - `addAllowedEmail`: Validates the entered email with Zod, ensures the user is an authorized admin, checks that the email doesn't already exist, and creates the new operator on the allowlist (with optional admin privileges).
    - `toggleAdminStatus`: Validates target email, verifies invoking operator's admin status, and toggles target user's `isAdmin` property. Includes an uncompromising safety check to prevent demoting the last administrator.
    - `removeAllowedEmail`: Validates target email, verifies invoking operator's admin status, and removes the email from the allowlist. Includes an uncompromising safety check to prevent removing the last administrator.
- **Gated Server-Side UI (`src/app/admin/page.tsx`)**:
  - Built a secure, server-rendered Admin panel page using React Server Components.
  - Checks if the user's session is authenticated and looks up their allowlist record. If the user is not found or is not an administrator, they are silently redirected to `/` (complying with standard gated routing design).
  - Displays high-contrast alert boxes for errors and operations success.
  - Lists all allowed operators, sorted by registration ID, with dedicated actions to toggle admin privileges or completely revoke allowlist access.
  - Styled to match the bold, high-contrast, sharp-cornered "high-voltage brutalist" visual system precisely (including `.panel-aggressive`, `.btn-assault`, `.hazard-stripes`, and matching color palettes).
- **Navbar & Layout Integration (`src/app/layout.tsx` & `src/app/components/Navbar.tsx`)**:
  - Modified `RootLayout` to import Prisma Client, lookup the `isAdmin` state of the current session user alongside the `auth()` call, and thread the value to the `<Navbar />` component.
  - Extended `NavbarProps` to accept `isAdmin?: boolean`.
  - Dynamically appends the "ADMIN" tab (utilizing a high-voltage, check-shield SVG icon) to the mobile bottom bar and desktop sidebar menu `navItems` if and only if `isAdmin` is `true`.

## Visual-Verification Caveat
Because the agent does not have access to a browser, visual/aesthetic correctness could not be verified in-browser. The UI was built strictly around existing Tailwind tokens, `.panel-aggressive`, `.btn-assault`, `.hazard-stripes`, and matching brand-color CSS variables specified in `globals.css` and `Navbar.tsx`. Manual visual review is highly recommended.

## Manual Test Plan (Run before shipping to Staging/Production)

### Preparation
1. **Initialize a Fresh Local Environment**:
   - Run `npx prisma migrate reset --force` to start from a clean state.
   - Run the seed command to provision two test users:
     `ALLOWED_EMAILS="member@example.com" SEED_ADMIN_EMAIL="admin@example.com" npx prisma db seed`
   - This sets up:
     - `admin@example.com` (Member of allowlist, `isAdmin: true`)
     - `member@example.com` (Member of allowlist, `isAdmin: false`)

---

### Test Case A: Access Gating and Redirection
**Goal**: Verify that non-admin operators are completely restricted from accessing the admin page or invoking its server actions.

1. **Step A.1: Sign in as Member**:
   - Mock/simulate logging in as `member@example.com`.
2. **Step A.2: Verify Navigation Visibility**:
   - Confirm that the "ADMIN" menu item does **not** appear in either the desktop sidebar or the mobile bottom navigation bar.
3. **Step A.3: Direct Route Access Gating**:
   - Attempt to navigate directly to `/admin` in your browser.
   - **Expected Result**: You are immediately redirected back to `/` and no Admin UI is rendered.
4. **Step A.4: direct Server Action Abuse Gating**:
   - Simulate a direct server action post request to `addAllowedEmail`, `toggleAdminStatus`, or `removeAllowedEmail` as `member@example.com` (e.g. using curl or manually invoking the action on the client).
   - **Expected Result**: The action is rejected, and you are redirected to `/admin?error=unauthorized`.

---

### Test Case B: Admin Management Actions (Full CRUD)
**Goal**: Verify an administrator can add, toggle, and remove allowlist operators.

1. **Step B.1: Sign in as Admin**:
   - Mock/simulate logging in as `admin@example.com`.
2. **Step B.2: Verify Navigation Visibility**:
   - Confirm that the "ADMIN" menu item appears with the shield icon.
3. **Step B.3: Access Route**:
   - Click "ADMIN" or go directly to `/admin`.
   - **Expected Result**: The page renders cleanly and lists `admin@example.com` (labeled as `ADMIN` with a `YOU` badge) and `member@example.com` (labeled as `MEMBER`).
4. **Step B.4: Add Operator (New Member)**:
   - In the "Provision New Operator" form, type `newuser@example.com` and leave "Grant Administrator Privileges" unchecked. Click "Authorize Operator".
   - **Expected Result**: The page reloads with a green banner "Email address successfully added to allowlist." and `newuser@example.com` is listed at the bottom as a `MEMBER`.
5. **Step B.5: Add Operator (New Admin)**:
   - Type `anotheradmin@example.com`, check "Grant Administrator Privileges", and click "Authorize Operator".
   - **Expected Result**: The page reloads showing `anotheradmin@example.com` as an `ADMIN`.
6. **Step B.6: Duplicate Prevention**:
   - Try to add `newuser@example.com` again.
   - **Expected Result**: The page reloads showing a red banner "This email address is already on the allowlist." and the operation is rejected.

---

### Test Case C: Lockout Prevention / Last Admin Invariant Check
**Goal**: Ensure it is absolutely impossible to demote or remove the last administrator (preventing total lockouts).

1. **Step C.1: Demote the Secondary Admin**:
   - Click the "ADMIN" button next to `anotheradmin@example.com` to toggle their status.
   - **Expected Result**: Success banner "Admin status successfully updated." appears and `anotheradmin@example.com` is now a `MEMBER`.
   - **Status Check**: Only `admin@example.com` remains as an administrator.
2. **Step C.2: Try to Demote the Last Admin**:
   - Click the "ADMIN" button next to `admin@example.com` (labeled as `YOU`) to demote yourself.
   - **Expected Result**: Action is blocked. Red banner "Cannot remove or demote the last administrator. At least one admin is required." is displayed. `admin@example.com` remains `ADMIN`.
3. **Step C.3: Try to Revoke Access for the Last Admin**:
   - Click "REVOKE ACCESS" next to `admin@example.com`.
   - **Expected Result**: Action is blocked. Red banner "Cannot remove or demote the last administrator. At least one admin is required." is displayed. `admin@example.com` is NOT removed.
4. **Step C.4: Delete Other Users**:
   - Click "REVOKE ACCESS" next to `member@example.com`, `newuser@example.com`, and `anotheradmin@example.com`.
   - **Expected Result**: Successful removal for each, accompanied by "Email address successfully removed from allowlist." banner. Only the sole administrator remains in the database.

   # Handoff: Extended Admin Panel - Catalog Management & Read-Only User Visibility (feature/admin-panel-phase-2) - August 21, 2026

   ## What was built
   - **Global Catalog Management (Workouts & Meals)**:
   - **Secure Server Actions (`src/app/admin/catalog-actions.ts`)**:
     - Created strict, Zod-validated, and administrator-gated Server Actions (`createWorkout`, `updateWorkout`, `deleteWorkout`, `createMeal`, `updateMeal`, `deleteMeal`).
     - Implemented a custom slugification utility with dynamic counter suffixing (e.g. `hellfire-metcon-1`) to automatically resolve title-to-slug collisions when provisioning new catalog items.
     - Used transactional database safety (`prisma.$transaction`) to handle sub-element mutations (purging old exercises and inserting new ones) and to safely handle dynamic ID slug-updates without disrupting references.
   - **Interactive Catalog Dashboards (`src/app/admin/workouts` & `src/app/admin/meals`)**:
     - Built SPA-like catalog managers (`WorkoutsManager.tsx` and `MealsManager.tsx`) that enable administrators to view list entries, trigger creation forms, modify details, or prune obsolete catalog entries.
     - Designed dynamic React forms (`WorkoutForm.tsx` and `MealForm.tsx`) featuring fully client-managed repeatable sub-forms. Administrators can add/remove exercises (with custom sets, reps, rest periods, and optional notes) or edit lists of ingredients and cooking steps dynamically.
     - Styled to perfectly match the brand's premium, sharp-cornered "high-voltage brutalist" visual system, complete with macro readouts, difficulty trackers, and active animations.
   - **Read-Only Operator Intel (Other-User Visibility)**:
   - **Overview Registry Portal (`src/app/admin/users/page.tsx`)**:
     - Built a dedicated directory displaying every registered user (derived from Google Sign-In records), listing their email, name, number of active/total wager contracts, initialized metric status, and count of weigh-ins.
   - **Diagnostic Report Detail Route (`src/app/admin/users/[id]/page.tsx`)**:
     - Created a dynamic dynamic route to audit individual operators.
     - Displays detailed metric profiles (streaks, weights, target benchmarks), chronologically ordered weight logs, and detailed wager contracts with corresponding status badges (WON, LOST, ACTIVE).
     - **Defense in Depth / Audit-Only Constraint**: Gated exclusively with `checkAdmin()`. Form inputs, edit actions, and mutation parameters are completely absent in this directory. Security warning labels enforce the diagnostic-only nature of this view.
   - **Quick Portal Navigation Deck (`src/app/admin/page.tsx`)**:
   - Integrated a premium three-column portal deck inside the main `/admin` screen to provide immediate, discoverable entry points into the Workouts Catalog, Meals Catalog, and Operator Intel diagnostic portal.

   ## Visual-Verification Caveat
   Because the agent operates headlessly without a browser, visual and design integration was modeled entirely on preexisting project Tailwind definitions, `.panel-aggressive`, `.btn-assault`, `.hazard-stripes`, and active layout spacing parameters. Physical brower validation of the forms, cards, and user grids is recommended.

   ## Manual Test Plan (Run before shipping to Staging/Production)

   ### Test Case A: Gated Security Gating (Defense-In-Depth)
   **Goal**: Verify that non-admin operators cannot access any phase 2 dynamic routes or call their server actions.

   1. **Step A.1: Sign in as Member**:
    - Authenticate/mock session as a regular user (e.g. `member@example.com` who is not marked as `isAdmin: true` on the allowlist).
   2. **Step A.2: Direct Route Block Check**:
    - Manually navigate your browser to the following URLs:
      - `/admin/workouts`
      - `/admin/meals`
      - `/admin/users`
      - `/admin/users/some-user-id`
    - **Expected Result**: In every single case, you are immediately redirected back to `/` and no data or layout is exposed.
   3. **Step A.3: Server Action Abuse Check**:
    - Attempt to call any Server Action from `catalog-actions.ts` directly (e.g. `deleteMeal`, `createWorkout`) under a non-admin session.
    - **Expected Result**: The action halts instantly, and you are redirected to `/admin?error=unauthorized`.

   ---

   ### Test Case B: Catalog CRUD & Dynamic Slug Resolution
   **Goal**: Verify full lifecycle of catalog creation, collision handling, updating, and propagation.

   1. **Step B.1: Sign in as Admin**:
    - Authenticate/mock session as `admin@example.com` (`isAdmin: true`).
   2. **Step B.2: Navigate to Workouts Catalog**:
    - Access `/admin/workouts` and click "+ PROVISION NEW WORKOUT".
   3. **Step B.3: Provision Workout with Exercises**:
    - Fill out Title: `Anabolic Conditioning`, Target: `Metcon / Fat loss`, Calories Burn: `600`, duration `30 Mins`, Select intensity `ANARCHIC`, select category `AMRAP`.
    - Click "+ ADD EXERCISE" twice to provision two exercises. Fill out name, sets, reps, rest for both.
    - Click "PROVISION WORKOUT".
    - **Expected Result**: Successfully redirected to list view. Banner "Workout successfully provisioned in catalog." is displayed. `Anabolic Conditioning` is listed, and its ID slug is `anabolic-conditioning`.
   4. **Step B.4: Trigger ID Slug Collision Resolution**:
    - Click "+ PROVISION NEW WORKOUT" again.
    - Fill out the form with the **exact same title**: `Anabolic Conditioning` but different exercises/calories. Click "PROVISION WORKOUT".
    - **Expected Result**: The new workout is created successfully. Its ID slug automatically resolves to `anabolic-conditioning-1` with no errors, preserving both records cleanly in the database.
   5. **Step B.5: Verify Public Propagation**:
    - Navigate to the user-facing training page `/workouts`.
    - **Expected Result**: Both `Anabolic Conditioning` and its sibling appear in full styling, complete with exercises, calories, and categories.
   6. **Step B.6: Edit Detail & Delete**:
    - Go back to `/admin/workouts`, click "EDIT DETAILS" next to `anabolic-conditioning-1`, alter some fields, and click "LOCK IN CHANGES". Verify change is applied.
    - Click "DELETE" on both. Confirm deletion is applied. Verify they no longer appear on `/workouts`.

   ---

   ### Test Case C: Read-Only User Intel Auditing
   **Goal**: Verify user profiles are fully audit-ready and completely read-only.

   1. **Step C.1: Access User Directory**:
    - Go to `/admin`, and click the "Operator Intel" card (or navigate directly to `/admin/users`).
    - **Expected Result**: Lists all active signed-in operators (including yourself).
   2. **Step C.2: Click User details**:
    - Click "VIEW USER INTEL" next to any operator.
    - **Expected Result**: Detailed diagnostic panel loads showing:
      - Warning banner informing you of strictly read-only security mode.
      - Accurate metric profile (streak, start weight, etc.).
      - Chronological list of weigh-in records.
      - Complete breakdown of active/historical wager commitments with colored status badges.
   3. **Step C.3: Verify Read-Only Integrity**:
    - Audit the entire page.
    - **Expected Result**: No text-fields, check-boxes, toggle buttons, forms, delete links, or "save" prompts exist anywhere in this template. All information is rendered as static, formatted read-only metrics.

# Handoff: Real Multi-User Isolation, Onboarding Flow & Beta Slot Tracking (feature/multiuser-beta) - August 25, 2026

## What was built
- **Multi-User Data-Isolation Bug Fix (`src/app/page.tsx` & `src/app/progress/page.tsx`)**:
  - Resolved a severe data-leak bug in `src/app/page.tsx` (the main dashboard) where it queried `prisma.progress.findFirst()` without any `where: { userId }` clause, leaking the first progress row in the database to any logged-in user.
  - Implemented the same strict session-gating and per-user querying found on `/progress` and `/wagers`: dashboard now redirects unauthenticated users to `/signin` and scopes the progress lookup directly to `session.user.id`.
  - Refactored `/` and `/progress` to seamlessly redirect users to `/onboarding` if they do not yet have progress data, ensuring no user ever faces a "Data not found" or "No progress data found" dead-end wall.
- **Dynamic Streak Propagation (`src/app/layout.tsx` & `src/app/components/Navbar.tsx`)**:
  - Replaced the hardcoded `"12 DAYS STRONG"` and `"🔥 12 DAYS"` strings in both the desktop sidebar and the mobile header.
  - Added user-session lookup of `currentStreak` inside the server-rendered `RootLayout` and passed this dynamic state through to the `<Navbar>` component and the mobile header component.
- **Self-Service Onboarding Flow (`src/app/onboarding/`)**:
  - Built a completely new, gated self-service onboarding route at `/onboarding/page.tsx` with high-contrast, brutalist design matching the app's premium aesthetic.
  - Created a robust Server Action at `src/app/onboarding/actions.ts` utilizing Zod schema validation to confirm input telemetry (`startWeight`, `currentWeight`, `targetWeight`) are valid positive numbers.
  - The Server Action strictly verifies the authenticated session, guarantees no other user's records are accessed, creates the initial `Progress` row (with streaks starting at 0), and inserts a chronological baseline `WeightRecord` using the formatted current date (e.g. `"Aug 25"`), allowing the weight trend visualizer to function immediately.
- **Beta Slot Capacity Counter (`src/app/admin/page.tsx`)**:
  - Integrated a slot utilization tracker inside the admin panel that counts how many non-admin `AllowedEmail` rows are currently provisioned out of 10.
  - Displays a high-contrast badge in the provisioning card showing `[Used] / 10 BETA SLOTS USED`.
  - Implemented a prominent, non-blocking warning banner that flashes in the provision panel if the slot limit is reached or exceeded (e.g. `10 / 10`), warning administrators before they override the capacity limit.

## Visual-Verification Caveat
Because the agent operates headlessly in Auto-Edit mode, visual/aesthetic rendering could not be checked live in a browser. The onboarding UI and slot tracker were designed strictly utilizing the unified `.panel-aggressive`, `.btn-assault`, `.hazard-stripes`, and matching brand tokens defined in `globals.css`. Manual browser-level visual verification is highly recommended.

## Manual Test Plan (Run before shipping to Staging/Production)

### Preparation
1. **Initialize a Fresh Local Database State**:
   - Run `npx prisma migrate reset --force` to clear all tables.
   - Run the seed command to populate workouts, meals, and register an admin allowlist email:
     `SEED_ADMIN_EMAIL="admin@example.com" npx prisma db seed`
   - Log in once as `admin@example.com` to create their user account record.
   - Using Prisma Studio (`npx prisma studio`), verify:
     - `User` table contains 1 row (`admin@example.com`'s account).
     - `Progress` table is completely empty.

---

### Test Case A: Gated Onboarding & Self-Service Telemetry Initialization
**Goal**: Verify a newly registered operator without progress data is forced to onboard and cannot view the empty dashboard.

1. **Step A.1: Access Main Dashboard**:
   - Navigate to `/` as `admin@example.com`.
   - **Expected Result**: You are automatically redirected to `/onboarding`. The dashboard is not visible.
2. **Step A.2: Access Progress Page**:
   - Try to navigate directly to `/progress`.
   - **Expected Result**: You are automatically redirected to `/onboarding`.
3. **Step A.3: Submit Invalid Telemetry**:
   - In the onboarding form, enter `-200` for Starting Mass or leave values empty. Click "ENGAGE PROTOCOL".
   - **Expected Result**: Form inputs fail validation (Zod blocks negative numbers/empty fields). You are redirected back to `/onboarding?error=invalid-values` displaying a red warning banner.
4. **Step A.4: Submit Valid Telemetry**:
   - Fill out:
     - Starting Mass: `205.0`
     - Current Mass: `198.5`
     - Target Mass: `185.0`
   - Click "ENGAGE PROTOCOL".
   - **Expected Result**: The Server Action creates:
     - 1 `Progress` row with `currentStreak: 0`, `bestStreak: 0`.
     - 1 `WeightRecord` row with `weight: 198.5` and `date: "Aug 25"`.
   - You are redirected cleanly to the main dashboard `/`.
5. **Step A.5: Verify Dashboard Recovery**:
   - Hitting `/` and `/progress` now renders completely and correctly without redirecting.
   - The desktop sidebar and mobile header display `0 DAYS STRONG` and `🔥 0 DAYS` respectively (since streak started at 0).
   - The weight trend widget on `/progress` displays a single entry for `"Aug 25"` at `198.5 LBS`.

---

### Test Case B: Strict Multi-User Data Isolation
**Goal**: Verify that distinct users see only their own scoped progress and cannot view each other's metrics.

1. **Step B.1: Create Second User**:
   - In the admin panel `/admin`, provision a new operator `member@example.com`.
   - Log in as `member@example.com` to create their account.
2. **Step B.2: Onboard Second User**:
   - Hitting `/` redirects `member@example.com` to `/onboarding`.
   - Fill out their telemetry:
     - Starting Mass: `160.0`
     - Current Mass: `155.0`
     - Target Mass: `140.0`
   - Click "ENGAGE PROTOCOL".
3. **Step B.3: Verify Scoping on Dashboard (`/`)**:
   - As `member@example.com` on `/`:
     - **Expected Result**: Current Mass displays `155 LBS`, and target displays `140 LBS`. Total shed displays `5.0 LBS`.
   - Log back in as `admin@example.com` on `/`:
     - **Expected Result**: Current Mass displays `198.5 LBS`, and target displays `185.0 LBS`. Total shed displays `6.5 LBS`.
     - No data leaks from `member@example.com`.

---

### Test Case C: Beta Slot Counter & Capacity Warnings
**Goal**: Verify that the beta slot ratio computes correctly and flags warning status upon exceeding capacity.

1. **Step C.1: Check Initial Capacity Status**:
   - Navigate to `/admin` as `admin@example.com`.
   - Under "PROVISION NEW OPERATOR", observe the slot counter badge.
   - **Expected Result**: Badge displays `1 / 10 BETA SLOTS USED` (only `member@example.com` is a non-admin allowlist member; `admin@example.com` does not count since they are an administrator). No warning banner is visible.
2. **Step C.2: Fill Allowlist up to Capacity Limit**:
   - Add 9 more member emails (e.g. `m1@test.com` through `m9@test.com`) with "Grant Administrator Privileges" unchecked.
   - **Expected Result**: The slot counter badge dynamically updates to `10 / 10 BETA SLOTS USED`.
   - A high-visibility warning banner appears within the card: `"BETA CAPACITY WARNING: YOU HAVE REACHED THE 10-SLOT LIMIT. ADDING MORE SHIFTS THE APPLICATION TO AN OVER-CAPACITY STATE."`
3. **Step C.3: Exceed Capacity Limit**:
   - Add one more non-admin email `extra@test.com`.
   - **Expected Result**: The action is not hard-blocked. `extra@test.com` is successfully added.
   - The slot counter badge updates to `11 / 10 BETA SLOTS USED`, and the warning banner remains active.

# Handoff: Real AI Meal Planning Integration (feature/ai-meal-planning) - August 25, 2026

## What was built
- **Unified AI Generation Server Action (`src/app/meals/actions.ts`)**:
  - Implemented a unified Server Action `generateAiMeal` that serves as the single generation engine supporting two key user entry points: Pantry-driven ("kitchen sink") and Macro-driven ("let's go shopping").
  - Integrates the official `@google/generative-ai` SDK using the high-performance `gemini-1.5-flash` model and configures structured JSON responses via `responseMimeType: "application/json"`.
  - Added strict Next-Auth session checks at the action entry point to ensure only authenticated users can run generations.
  - Implemented strict input validation using Zod discriminated unions and structured output validation of the model's raw JSON response to ensure correctness before it reaches the frontend.
  - Gracefully catches API errors, parse errors, and validation errors, returning structured `{ success: false, error: "..." }` responses to avoid application-level crashes.
- **Interactive AI Meal Planner UI Component (`src/app/meals/AiMealPlanner.tsx`)**:
  - Replaced the disabled mock panel in `src/app/meals/page.tsx` with a fully interactive client component.
  - Created a dual-tab navigation selector ("🛒 Kitchen Sink" vs "🎯 Let's Go Shopping") supporting both generation modes in a single visual space.
  - Added real input fields: a spacious textarea for raw pantry ingredients and four numeric input fields (Calories, Net Carbs, Protein, Fat) populated with standard tactical keto defaults.
  - Implemented high-contrast brutalist loading states (pulsing card skeleton + disabled active buttons) and stylized error alerts if generation fails.
  - Integrated dynamic rendering of the generated meal using the **exact same markup and responsive layout** already used for real `Meal` rows in the application, including custom rendering for the recommended grocery shopping run.

## Key Architectural Decisions & Constraints
- **Ephemeral-by-Design (No Persistence)**: Consistent with the product's premium roadmap, generated meal protocols are kept purely in-memory (ephemeral) on the client side. They are never written to the SQLite `Meal` table or database, nor do they touch any prisma models. No save button or database persistence has been scaffolded, preserving this as a clean up-sell boundary.
- **Unified Prompt & Single Action**: Both modes invoke the same underlying server action. The action dynamically builds a structured Chef/Coach prompt based on the chosen entry point, ensuring highly consistent nutrition recommendations.
- **Strict Error Boundary**: LLM outputs are treated as completely untrusted input. Raw text is parsed safely and Zod-validated against the schema before rendering.

## Visual-Verification Caveat
Because the agent operates headlessly in Auto-Edit mode, visual layout and aesthetics could not be verified in a real browser. The tabs, responsive forms, skeleton loading animations, and grocery checklist were designed strictly using standard theme colors, `.panel-aggressive`, `.btn-assault`, `.label-micro` typography, and the established high-contrast matte black/orange design. Manual visual verification is highly recommended.

## Manual Test Plan (Run before shipping to Staging/Production)

### Verification Without GEMINI_API_KEY
1. **Navigate to Nutrition System Page (`/meals`)**:
   - Access `/meals` in your browser.
   - **Expected Result**: The previous disabled/preview-only mock fields are replaced by the active AI Meal Planner interface.
2. **Toggle Modes**:
   - Click back and forth between "Kitchen Sink (Pantry-Driven)" and "Let's Go Shopping (Macro-Driven)".
   - **Expected Result**: The inputs switch smoothly from the pantry ingredients textarea to the macro targets grid, with zero page jitter.
3. **Trigger Missing API Key Error**:
   - Enter some ingredients (e.g. `eggs, bacon, spinach`) or keep the macro defaults and click "GENERATE PROTOCOL FEAST".
   - **Expected Result**: The button changes to "COMPUTING FUEL PROTOCOL..." and enters a pulsing state. Within a second, a high-visibility, red-bordered "GENERATION THREAD INTERRUPTED" warning banner displays, explaining that `GEMINI_API_KEY` is missing from the server environment. This confirms the complete server action routing, authentication check, input validation, and error output boundaries are fully operational.

### Verification With GEMINI_API_KEY
1. **Configure Environment**:
   - Add a valid `GEMINI_API_KEY="AIzaSy..."` to your local `.env` file and restart the development server.
2. **Test Pantry-Driven Entry Point**:
   - Choose the "Kitchen Sink" tab.
   - Enter `ribeye steak, avocado, butter, salt`.
   - Click "GENERATE PROTOCOL FEAST".
   - **Expected Result**: The loading animation plays. Upon successful generation, a high-contrast card "SYNTHESIZED ACTIVE PROTOCOL:" appears below the form containing the customized recipe name, motivational description, calculated keto macros (high fat/protein, very low carb), preparation steps, and ingredients.
3. **Test Macro-Driven Entry Point**:
   - Choose the "Let's Go Shopping" tab.
   - Keep or modify the targets (e.g. 1500 kcal, 10g net carbs, 120g protein, 110g fat).
   - Click "GENERATE PROTOCOL FEAST".
   - **Expected Result**: After loading, a custom recipe card appears matching these macros within a reasonable range. Below the cooking protocol, a custom "⚡ RECOMMENDED GROCERY RUN" section is rendered showing a checkbox-checklist of the ingredients needed at the store.
4. **Test Session Gate**:
   - Manually clear your sign-in cookie or open an incognito window and attempt to access `/meals`.
   - **Expected Result**: You are blocked by the middleware/proxy and redirected to `/signin`. If you attempt to programmatically invoke the server action, it returns `UNAUTHORIZED`.

# Handoff: Required, Unique, Changeable Usernames (feature/username-system) - August 25, 2026

## What was built
- **Schema Migration (`prisma/schema.prisma` & migration script)**:
  - Added a nullable unique `username String? @unique` field to the `User` model.
  - Generated and applied a safe, additive SQLite migration `add_username_to_user` (`20260826011840_add_username_to_user`) which keeps existing production/beta rows completely intact.
- **Database-Agnostic, Case-Insensitive Validation Engine (`src/lib/username.ts`)**:
  - Created `usernameSchema` using Zod which enforces trimming, a 3-20 character limit, and alphanumeric plus underscore characters only (`^[a-zA-Z0-9_]+$`).
  - Implemented `checkUsernameTaken` helper which retrieves active non-null usernames and validates availability using a database-agnostic, case-insensitive comparison (`.toLowerCase()`). This prevents database collation-specific bugs and makes it completely safe to run across SQLite and PostgreSQL databases.
- **Username Picker Gate Page (`src/app/choose-username/`)**:
  - Created a new gated picker page `/choose-username` and its corresponding Server Action `chooseUsername`.
  - It validates the username, ensures there are no case-insensitive collisions, saves the precise casing chosen by the user in the database, and redirects them to the dashboard.
  - It automatically blocks users who already have usernames by redirecting them back to `/`.
- **Application-Level Gating (`src/app/page.tsx`, `src/app/progress/page.tsx`, `src/app/onboarding/page.tsx`, `src/app/wagers/page.tsx`)**:
  - Gated all primary protected pages so that any authenticated session without a chosen username (`username === null`) is immediately redirected to `/choose-username`.
- **Operator Profile Management (`src/app/profile/`)**:
  - Created a new `/profile` settings page and its Server Action `updateUsername`.
  - Renders current user credentials (Name, Email, Current Callsign) and allows them to update their username under the exact same validation rules and case-insensitive uniqueness checks as the initial picker.
  - Seamlessly handles self-exclusion during the uniqueness check, allowing users to modify the casing of their own username (e.g., `dave` -> `Dave`) without throwing a duplicate callsign error.
- **Navbar Identity Display Swap (`src/app/components/Navbar.tsx` & `src/app/layout.tsx`)**:
  - Updated `src/app/layout.tsx` to retrieve the user's `username` alongside their streak/session details in a concurrent `Promise.all` query.
  - Threaded the `username` to `<Navbar />`, swapping the sidebar and header identity displays to show the formatted username (e.g., `@hunter_99`) instead of the raw email address.
  - Preserved a fallback to raw email address only for the rare/brief window before a user chooses a username.

## Key Architectural Decisions & Constraints
- **Nullable Column + Application Gate Migration Strategy**: Adding a non-nullable `username String @unique` column in a single migration would instantly fail or silently force unsafe defaults against existing beta user records in SQLite. By making the field nullable at the database level and enforcing mandatory selection via an application-level gate, we achieve the exact same behavior safely and additively without risking real database corruption or reset.
- **Edge Layer Gating Limitations (NextAuth Middleware)**: NextAuth's middleware runs in the Next.js Edge Runtime. At the edge layer, NextAuth cannot execute database queries or use our Prisma adapter because native Node.js binaries (such as `better-sqlite3` and the local file system SQLite database) are incompatible with the Edge runtime environment. Consequently, `req.auth?.user?.username` is not reliably populated or accessible within `src/proxy.ts`. Attempting to load the user's database session there would crash.
- **Comprehensive Page-Level Gate Coverage**: To ensure no signed-in user without a username can bypass the Required Username gate, we added explicit page-level redirects to all remaining protected areas of the site, including `/meals`, `/workouts`, `/workouts/[id]`, and the entire `/admin` section and its nested catalog/operator views (`/admin`, `/admin/meals`, `/admin/workouts`, `/admin/users`, `/admin/users/[id]`). This guarantees that any session lacking a callsign is uniformly forced to `/choose-username`.
- **In-Memory Case-Insensitive Matching**: SQLite has limited case-insensitive lookup capabilities because of default collation and type-filter constraints. Running case-insensitive comparisons inside the validation utility (`.toLowerCase()`) is completely database-independent, robust, and highly optimized for our small trusted beta.
- **No Avatars / No Peer Wager Changes**: Left existing OAuth avatars, names, and emails completely untouched as requested to focus strictly on Phase 1 username protocols.

## Visual-Verification Caveat
Because the agent operates headlessly in Auto-Edit mode, visual layout and design could not be verified in a real browser. The picker page, the profile settings page, the new navbar profile tab (represented by a high-contrast user icon), and the alert banners were designed strictly using standard theme colors, `.panel-aggressive` panels, `.btn-assault` assault buttons, and the high-contrast aesthetic. Manual visual verification is highly recommended.

## Manual Test Plan (Run before shipping to Staging/Production)

### Test Case A: Gated Onboarding & Callsign Enforcement
1. **Sign In with a Fresh Account**:
   - Access the application and sign in.
   - **Expected Result**: Since the account has no username, hitting `/`, `/progress`, `/wagers`, or `/onboarding` must instantly redirect the user to `/choose-username`.
2. **Attempt to Bypass with Direct URL**:
   - Manually enter `/` or `/onboarding` in the browser bar.
   - **Expected Result**: Instantly redirected back to `/choose-username`.
3. **Submit Blank or Invalid Callsigns**:
   - Enter `a` (less than 3 chars), or a username with spaces/symbols (e.g. `cool boy!`).
   - **Expected Result**: Frontend HTML validations or Server Action Zod validation blocks submission, redirecting to `/choose-username?error=invalid-format` showing the warning banner.

### Test Case B: Case-Insensitive Uniqueness Check
1. **Choose an Available Username**:
   - On the fresh account, type `operator_x` and submit.
   - **Expected Result**: Callsign is saved successfully, and the user is redirected to `/` (or `/onboarding` if progress data is still needed). The Sidebar immediately shows `@operator_x`.
2. **Create Collision with Case-Variant**:
   - Sign in with a second account (without a username).
   - Enter `Operator_X` (different casing of the taken callsign) on the picker.
   - **Expected Result**: Validation detects case-insensitive overlap and redirects the user to `/choose-username?error=taken` displaying "That username is already taken. Choose another."

### Test Case C: Profile Settings & Casing Self-Exclusion
1. **Access Profile settings**:
   - Click the "PROFILE" tab in the desktop sidebar or tap it in the mobile navigation.
   - **Expected Result**: Renders credentials successfully, displaying `@operator_x`.
2. **Test Casing Change (Self-Exclusion)**:
   - Type `Operator_X` (changing the casing of your own username) and submit "COMMIT CHANGE".
   - **Expected Result**: The update succeeds because your own user ID is excluded from the uniqueness check. The profile and Navbar immediately reflect the updated casing `@Operator_X`.
3. **Change to Another User's Callsign**:
   - Type `another_user` (assuming `another_user` exists).
   - **Expected Result**: Blocked by case-insensitive check, displaying the error.

## 2026-08-26 — Peer-to-peer wager challenges

Phase 2 of `docs/FUTURE-WAGERS.md`'s own roadmap ("add peers, still no
money"). Built directly (not via the usual Gemini-CLI pass — three
consecutive attempts at this specific prompt stalled at 30+ minutes with
zero tool calls, on both Auto-routed and explicitly-pinned models; the
design was already fully specified in `docs/GEMINI-PEER-WAGERS-PROMPT.md`
so it was implemented directly against that spec instead of retrying a
fourth time).

### What was built
- `Wager.challengedUserId` (nullable) + a named `WagerChallenged` relation
  on `User` - `null` means a solo wager, unchanged from phase 1.
- `Wager.startValue` became nullable - a peer challenge is created with no
  baseline (`status: "PENDING"`); the baseline is only captured once the
  challenged user accepts, from *their own* `Progress` row at that moment.
- New statuses: `PENDING` (awaiting response) and `REJECTED` (terminal).
- `createWager` (in `src/app/wagers/page.tsx`) gained an optional
  `challengeUsername` field. Solo-wager behavior is byte-for-byte
  unchanged when it's absent - the peer path is a separate branch that
  returns before touching the creator's own `Progress` at all (they don't
  need one to challenge someone else).
- New `respondToChallenge` action: verifies `session.user.id ===
  wager.challengedUserId` before allowing Accept or Reject on a `PENDING`
  wager - not just a UI-level restriction. Accept captures the challenged
  user's current `Progress` as `startValue` and flips to `ACTIVE`. Reject
  is terminal.
- New `findUserByUsername` helper in `src/lib/username.ts` (case-
  insensitive, mirrors the existing `checkUsernameTaken` pattern).
- Resolution loop extended: it now also auto-resolves `ACTIVE` wagers
  where `challengedUserId === me`, evaluated against *my* `Progress` -
  `evaluateWager` itself was not touched. Explicitly excludes wagers I
  created *for* someone else from this check (those resolve on their
  page load, against their data, not mine).
- `/wagers` gained two new sections: "Challenges Against You" (with
  Accept/Reject buttons on `PENDING` ones) and "Challenges You've Sent".
  The existing "Active Contracts"/"Resolved Contracts" sections were
  re-scoped to solo wagers only (`challengedUserId: null`) so their
  behavior and rendering are unchanged.
- `/profile` gained a stats panel: accepted / won / lost / rejected
  counts of challenges received.

### Goal-aggressiveness guardrail timing decision
The existing safety cap (~1% bodyweight/week for `WEIGHT_TARGET`) can't
run at challenge-creation time for a peer wager, because there's no
`startValue` yet to compute an implied pace from - the challenger doesn't
know the challenged user's current weight. Applied the same check instead
at **accept-time**, once the challenged user's real baseline is on the
table, blocking the accept (not the original challenge) with the same
`too-aggressive` error if the pace is unsafe. This keeps the safety net
in place without inventing a check that has no data to run against.

### Explicitly out of scope (per the prompt / FUTURE-WAGERS.md)
No witness/mutual-confirmation step, no notifications, no new metric
types (peer challenges use the same `WEIGHT_TARGET`/`STREAK_TARGET` as
solo wagers - a "run a 5k"-style dare isn't resolvable without new
tracking infrastructure that doesn't exist), no real money. `/admin`,
`/meals`, `/workouts`, and the username system were not touched, other
than one cosmetic side-effect: `admin/users/[id]/page.tsx` renders a
peer wager's `startValue` as blank instead of a number while it's still
`PENDING` (React renders `null` as nothing, not a crash) - left as-is
since touching `/admin` is out of scope for this pass.

### Manual test plan
No browser available - not visually verified. Cover:
- Regression: an existing/new solo wager (no `challengeUsername`) behaves
  identically to before - same fields, same status flow.
- Challenging a nonexistent username, or yourself, is rejected with a
  clear error and doesn't create a row.
- A `PENDING` challenge is only actionable (Accept/Reject visible and
  functional) for the actual challenged user - verify the
  `wager.challengedUserId !== userId` check, not just that the UI hides
  the buttons.
- Reject is terminal - no further state change possible on that wager.
- Accept without a `Progress` row is blocked with `no-progress`, same as
  solo creation.
- Accepting a `WEIGHT_TARGET` challenge with an unsafe implied pace is
  blocked with `too-aggressive`.
- `/profile` stats counts match a manually-constructed set of test wagers
  in each status.
- `npm run build` and `npm run lint` both pass (confirmed).
- Migration (`20260826040157_add_peer_wager_challenges`) is a standard
  SQLite table-rebuild that copies every existing row's columns forward
  unchanged - confirmed by reading the generated SQL directly, not just
  trusting the "applied successfully" message.



