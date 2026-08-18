# Future feature: AI-assisted meal planning

Not scoped for implementation yet — captures real, lived-experience product
guidance before it gets lost by the time this phase actually starts.
Written 2026-08-18. The "AI meal planning — coming soon" card on `/meals`
has been a placeholder since the original app-shell build; this is what
should actually go behind it.

## The core problem with AI-generated keto content

Most AI-generated keto/OMAD recipes are riddled with unnecessary extra:
elaborate multi-step techniques, specialty ingredients, plating and
garnish instructions ("sprinkle with chives") for a meal nobody is
plating. That's not how keto/OMAD actually gets lived day to day.

The lived reality, from the user directly (daily, over years, echoed by
friends doing the same thing): when you're on keto and OMAD, you're just
hungry, and you're happy to eat whatever's in the refrigerator. The
real, representative example given: **chicken breast, chopped and seared
in sesame oil, with a salad and a dressing made by mixing sriracha and
mayo.** That's a complete, good meal. It does not need a garnish. It does
not need a technique beyond "sear it."

## What this means for the feature

- **Effort and cost need to be first-class categorization dimensions,
  alongside macros** — not just calories/protein/fat/net-carbs (which the
  app already tracks), but how much effort a meal takes and roughly what
  it costs. A user should be able to say "give me something low-effort"
  the same way they'd filter by calories today.
- **Default toward low-effort, pantry/fridge-staple combinations**, not
  restaurant-style recipes. Protein + fat + something green + a
  two-ingredient sauce is a complete meal, not a fallback.
- **No garnish, no plating instructions, no unnecessary technique** unless
  a user explicitly opts into a higher-effort mode. "Sear it" is a
  complete instruction. Don't pad it.
- Consider a "combo" mode as the default generation shape, rather than a
  traditional numbered-steps recipe: protein choice + fat/cooking method +
  vegetable/salad + sauce, mixed and matched from a small set of real
  building blocks — closer to how the actual eating pattern works than a
  generated recipe card is.

## Implication for whenever this gets prompted out to Gemini

Whatever prompt eventually drives this implementation needs to encode this
directly — not just "call the Gemini API and generate a keto recipe," but
something closer to: *default to low-effort, low-cost, real-fridge
combinations; treat garnish/plating/multi-step technique as opt-in, not
default; surface effort and cost as filterable/adjustable dimensions
alongside the nutrition macros already in the data model.* Getting this
instruction wrong produces exactly the generic-AI-recipe problem this
doc exists to avoid.

## Open questions

- Does "effort" need its own scale (e.g. 1–3: assemble / one-pan sear /
  actual cooking), or is a simple low/medium/high enough?
- Does "cost" need real price data, or is a rough tier (pantry staple vs.
  specialty ingredient) sufficient for v1?
- Does this reuse the existing `Meal` model's shape, or does an
  AI-generated combo need its own lighter-weight representation distinct
  from the curated `Meal` entries already in the seed data?
