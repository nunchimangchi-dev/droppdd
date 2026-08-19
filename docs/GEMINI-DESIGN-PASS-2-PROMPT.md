# Gemini design pass 2: real visual craft, not another AI-default look

Read this in full before touching anything. You now have working billing on
search-grounded calls — use it. This pass is judged on whether it actually
looks considered and current, not on how many files it touched.

## Ground rules (unchanged from pass 1, still hard boundaries)

- **Cosmetic and structural-markup only.** No changes to data fetching,
  Prisma queries, server actions, auth, the wagers guardrail/resolution
  logic, or any `.ts`/`.tsx` logic beyond JSX structure and class names
  needed for the visual work itself.
- No new dependencies. No new routes or pages. Don't touch
  `.github/workflows/ci.yml`. Never touch `~/Projects/skyrise`.
- Work on a fresh branch off `main` (`feat/design-pass-2`). Commit locally.
  **Do not push, do not open a PR.** A human reviews live against the real
  running app afterward — same as last time, this is what actually catches
  problems, not assumed correctness.
- You have no browser and cannot visually verify your own work. Say so
  explicitly in your handoff notes rather than claiming you saw it render.
- Before finishing: run `npm run lint` and `npm run build` yourself and fix
  what's flagged.
- Append a new dated section to `HANDOFF.md` at the repo root: what changed,
  why, and an explicit note that visual appearance needs human review.

## Don't be lazy about this

Read `src/app/globals.css`, `src/app/components/Navbar.tsx`, and skim all
five page components (`page.tsx`, `workouts/`, `meals/`, `progress/`,
`wagers/`, `signin/`) before changing anything. A real finding already
worth acting on: **there is no actual design system here.** `globals.css`
is still the untouched Next.js default (just `--background`/`--foreground`
and the Geist font) — every page hand-rolls its own inline Tailwind classes
for the same colors (`orange-500`, `zinc-900`, etc.), spacing, and card
patterns, copy-pasted and re-derived independently per page. `/wagers` is
the newest page and shows this worst — it works, but it was built fast
tonight and never got a design pass at all.

Fixing that — real CSS custom properties / Tailwind theme tokens for the
color system, spacing scale, and card/typography patterns this app already
visually implies — would both look more considered and directly serve the
portability point below, so treat it as in scope, not just page-level
polish.

## What "modern, not AI-default" actually means here

Don't produce the recognizable default AI-generated look: generic rounded
cards, a stock purple/blue gradient, uniform shadow-lg everywhere, Inter at
default weights with no real hierarchy. Actually look at what current,
well-regarded product design looks like in 2026 before touching CSS:

- Search for real examples of **fitness/habit-tracking apps with a bold,
  aggressive, high-contrast aesthetic** — this app's existing voice
  (dark, orange-accent, uppercase tracking-wide headers, "no excuses" tone)
  is a real design direction already, not a blank slate. Find products that
  do that well and specifically, not generic "fitness app UI" mood boards.
- Also look at **how commitment-contract / stakes-based products** (the
  actual category `/wagers` belongs to — StickK, Beeminder, and similar)
  visually communicate risk/stakes/accountability, since that's a distinct
  design problem from a plain data table.
- Cite what you actually looked at in your `HANDOFF.md` note — real
  product names, not vague impressions — same standard as the portfolio
  tone-review pass.

## The constraint that matters most: fancy within limits

This needs to look genuinely crafted, but **not so elaborate it blocks
what comes next.** Concretely:

- **Portability**: stay on Tailwind CSS v4 utility classes + plain CSS
  custom properties. No CSS-in-JS library, no separate component-library
  dependency, nothing that couples the visual system to tooling beyond
  what's already here.
- **Security**: no remote CDN fonts/icons/scripts, no animation library
  requiring `unsafe-eval` or inline script injection. Everything self-
  contained in the existing build, same as it is now.
- **Future feature work**: droppdd still has real planned work ahead —
  wagers phase 2 (peer wagers), AI-assisted meal planning (currently a
  placeholder card on `/meals`), more wager metric types. Don't design
  anything so bespoke/one-off that adding those later means fighting the
  design instead of extending it. Reusable patterns (a real card
  component pattern, real spacing tokens) over one-off bespoke treatments
  per page.

## Process

1. `git checkout main && git pull && git checkout -b feat/design-pass-2`
2. Read the files named above first.
3. Do the real work — the design-system/token gap, then apply it, with
   `/wagers` as the priority page given it's never had a pass.
4. `npm run lint && npm run build`, fix anything flagged.
5. Commit locally, don't push.
6. Append to `HANDOFF.md`: what changed, the real examples referenced,
   and the explicit "I could not visually verify this" note.
