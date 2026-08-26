# Gemini: real AI meal planning, replacing the disabled mock UI

Read this in full before touching anything. `src/app/meals/page.tsx` has
a fully-designed but entirely disabled "AI TACTICAL NUTRITION" panel -
mock form fields (`disabled`), a mock "GENERATE PROTOCOL FEAST" button
(`disabled`), and copy that says "Active development is underway." This
prompt replaces that mock with a real, working generator. This is phase 2
of a 3-phase beta expansion (multi-user infra -> **this** -> leaderboard),
aligned directly with the maintainer beforehand - the two "kitchen sink"
(pantry-driven) and "let's go shopping" (macro-driven) features described
in the original product pitch are **one combined generation flow with two
entry points**, not two separate features, and generated meals are
**ephemeral by design** - never persisted to the `Meal` table. Saved
generated meals are an explicit future paid-tier feature, deliberately
out of scope here - don't build a save path, even a disabled one.

## Current state, exactly as it exists right now

- `src/app/meals/page.tsx` lines ~111-201: the disabled mock panel. Its
  three mock fields hint at the real shape: target caloric mass, dietary
  protocol (Strict Keto vs. Carb Cycling - only Strict Keto is
  meaningfully supported elsewhere in this app, matching its
  keto/OMAD framing throughout), and primary protein focus. Use these as
  a starting point for the real form, not a rigid spec - you're building
  two real entry points (see below), not just enabling this exact mock.
- `Meal` model (`prisma/schema.prisma`): `title, description, calories,
  protein, fat, netCarbs, category, ingredients (Json string[]),
  instructions (Json string[])`. A generated meal's shape must match this
  exactly so it can render through the **same card markup already used**
  for real meals in `meals/page.tsx` (see the `meals.map(...)` block,
  lines ~32-107) - reuse that rendering, don't build a second meal-card
  design.
- No existing LLM integration anywhere in this codebase - `grep`
  confirms zero references to Gemini/OpenAI/any generative SDK. This is
  a real greenfield integration, not wiring up something partially built.
- Existing server-action conventions to follow exactly: `"use server"`,
  Zod validation on all inputs before use (see
  `src/app/onboarding/actions.ts` or `src/app/admin/catalog-actions.ts`
  for the pattern), session check via `auth()` at the top (this one just
  needs *any* signed-in user, not admin - no `checkAdmin()` needed here).

## What to build

1. **One server action, two entry points.** Both entry points call the
   same underlying generation logic and produce the same output shape -
   don't build two separate actions/prompts to the model.
   - **Pantry-driven ("kitchen sink")**: user enters what they have on
     hand (a textarea, comma or newline separated - your call on exact
     input UX). Generate a recipe using primarily those ingredients,
     constrained to keto/low-carb macros consistent with the rest of this
     app.
   - **Macro-driven ("let's go shopping")**: user enters target
     calories/protein/fat/net-carbs (real inputs, replacing the mock's
     disabled dropdown). Generate **both** a suggested grocery list *and*
     a recipe derived from that list that hits the targets - the output
     for this entry point includes an extra `groceryList: string[]`
     alongside the meal itself; the pantry-driven entry point doesn't
     need one (the user already has their ingredients).
2. **Output shape**: matches the `Meal` model fields exactly (title,
   description, calories, protein, fat, netCarbs, category, ingredients,
   instructions) plus the optional `groceryList` for the macro-driven
   path. **Zod-validate the model's JSON response before rendering it** -
   an LLM's raw output is untrusted input the same way client form data
   is, and must be validated the same way before it's treated as
   structured data, not just trusted because it came back as JSON.
3. **Rendering**: the generated result renders using the **same meal-card
   markup** already used for real `Meal` rows in this file - don't
   duplicate the card design. It's just not written to the database.
   Show a loading state while generating (this is a real API call, not
   instant) and a real error state if generation fails - don't leave the
   user looking at a silently-stuck button.
4. **Gemini API integration**: new `GEMINI_API_KEY` env var (add to
   `.env.example` if one exists, or note in `HANDOFF.md` that it needs to
   be added to `.env` before this works - **don't try to obtain or set
   the actual key value yourself**, that's a human-only credential step
   handled separately). Use the `@google/generative-ai` npm package
   (add it as a real dependency, update `package-lock.json`). Never log
   the key, never expose it to the client - this is server-action-only,
   same as every other secret in this codebase.

## Explicit non-goals

- **No persistence.** Generated meals never create a `Meal` row, never
  touch the database at all beyond the read-only session check. No
  "save this meal" button, disabled or otherwise - that's future,
  deliberately not scaffolded here.
- Don't touch the real meals list (`meals.map(...)` rendering of actual
  `Meal` rows) - only the mock panel gets replaced.
- Don't add a new Prisma model for generated meals, grocery lists, or
  generation history - nothing here is stored.
- Don't touch onboarding, admin, wagers, or progress - unrelated to this
  feature.

## Verification

You have no browser and cannot visually verify - say so explicitly in
`HANDOFF.md`, same as every prior prompt. Since this involves a real
external API call, be specific in the manual test plan about what can
and can't be verified without a real `GEMINI_API_KEY` present (e.g. "the
UI and validation can be exercised without a key; the actual generation
call cannot be tested until a real key is added"). Also confirm: `npm run
build` and `npm run lint` both pass, and that a malformed/unexpected
model response is handled gracefully (doesn't crash the page, shows a
real error) rather than assumed well-formed.

## Constraints

- New branch: `git checkout -b feature/ai-meal-planning`.
- Commit locally. **Do not push, do not open a PR.**
- Append a dated `HANDOFF.md` section: what was built, the two-entry-point
  design, the ephemeral-only decision restated in your own words, the
  manual test plan, and the visual-verification caveat.

## Process

1. `git checkout -b feature/ai-meal-planning`
2. Read `src/app/meals/page.tsx`, `prisma/schema.prisma`'s `Meal` model,
   `src/app/onboarding/actions.ts`, and `src/app/admin/catalog-actions.ts`
   in full before changing anything.
3. Add the `@google/generative-ai` dependency.
4. Build the combined generation server action with both entry points,
   Zod-validated output.
5. Replace the mock panel's disabled UI with the real, working form(s),
   loading state, and error state, reusing the existing meal-card markup
   for the result.
6. Commit locally on `feature/ai-meal-planning`, don't push.
7. Append the dated `HANDOFF.md` section.
