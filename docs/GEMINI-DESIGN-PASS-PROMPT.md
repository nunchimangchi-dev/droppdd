# Gemini CLI task: cosmetic design pass

This one needs **interactive** `gemini`, not `-p` (headless mode can't
actually write files or run shell commands here — see the memory note from
that investigation, or just take it as given). Run from inside
`~/Projects/droppdd` on a fresh branch off `main`
(`cd ~/Projects/droppdd && git checkout main && git pull && git checkout -b
feat/design-pass && gemini`), then use `/model` to pick a model before
pasting this prompt — `gemini-3-flash-preview` is confirmed working;
`gemini-3.5-flash` and `gemini-3-flash` have both hit free-tier caps
recently, avoid those if quota errors show up again.

---

You are working in the `droppdd` repo, on a new branch off `main`, which
has a working app shell (Dashboard, Workouts, Meals, Progress) gated
behind Google sign-in. This is a **cosmetic-only** pass — no functional,
data, or auth logic changes. Read `src/app/globals.css` for the existing
theme tokens and skim all five page components plus
`src/app/components/Navbar.tsx` and `src/app/signin/page.tsx` before
touching anything, so whatever you add matches the existing dark/orange
"aggressive fitness" visual voice instead of introducing a different look.
Also check `node_modules/next/dist/docs/` and `AGENTS.md` before writing
any App Router code — this Next.js version (16.x) may differ from your
training data.

## What to build

Two concrete targets, plus a general consistency pass:

1. **Mobile bottom nav is crowded.** It now has 5 items (Dashboard,
   Workouts, Meals, Progress, Exit/sign-out) squeezed into
   `flex items-center justify-around`, and it's only going to get more
   crowded as the app grows. Redesign this so it doesn't feel cramped —
   options include (your judgment, pick one and justify it in the
   handoff): moving sign-out out of the bottom nav entirely (e.g. into the
   mobile top header, next to the existing streak badge), shrinking
   label/icon sizing, or a different layout entirely. Whatever you pick,
   it needs to still clearly work at a narrow phone width (this app is
   explicitly meant to be used mid-workout on a phone).
2. **`/signin` is bare.** Right now it's just a wordmark, one line of
   text, and a button in a plain bordered box. Give it more visual weight
   consistent with the rest of the app's high-intensity tone (the
   dashboard's headers, stat cards, and WOD card are good references for
   the level of visual energy to match) — without turning it into
   something that needs new dependencies or client-side JS. A static,
   CSS-only treatment is enough.
3. **General pass**: while you're in there, fix any spacing/hierarchy
   issues you notice in the Navbar's sidebar footer (the streak block +
   signed-in email + sign-out row can feel cramped together) and the
   mobile top header. Use your judgment on what's actually worth touching
   — don't manufacture busywork.

## Explicit boundaries — do not cross these

- **Cosmetic only.** No changes to data-fetching, Prisma schema,
  `src/auth.ts`, `src/proxy.ts`, middleware/route-gating logic, or what
  data any page displays. If a visual idea would require a data or logic
  change to pull off, drop the idea rather than expanding scope.
- Don't touch anything outside `~/Projects/droppdd`. Never read from or
  write to `~/Projects/skyrise`.
- **No new dependencies** — this is Tailwind CSS v4 utility classes and
  plain JSX/CSS. No animation libraries, no icon packages beyond the
  inline SVGs already used elsewhere in the codebase for consistency.
- No new routes, no new pages beyond what's needed for the two targets
  above.
- Don't modify `.github/workflows/ci.yml`.
- Work on a new branch (e.g. `feat/design-pass`), not `main`. Commit
  locally with clear, conventional commit messages as you go. **Do not
  `git push`. Do not open a PR.** Leave the branch local and unpushed — a
  separate review pass (with an actual browser, which you don't have)
  picks this up from here.

## Before you finish

Run `npm run lint` and `npm run build` yourself and fix anything they
flag. You don't have a browser or screenshot tool, so you can't visually
verify the result — that's expected, a human will do the actual visual
review afterward. Don't claim you verified how something looks; just
confirm lint/build pass and describe what you changed and why.

## Handoff

Update `HANDOFF.md` at the repo root — don't overwrite existing sections,
append a new one for this pass covering:

- What you changed for each of the three items above, and why you made
  the specific choices you did (especially the sign-out relocation
  decision, if you moved it).
- The exact commands you ran to verify, and confirmation they passed
  (lint, build).
- Explicitly note that visual appearance was not verified by you and
  needs a human with a browser to review.

Then stop. Don't start on anything beyond this cosmetic pass.
