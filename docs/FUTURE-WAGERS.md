# Future feature: wagers ("put your money where your mouth is")

Not scheduled, not scoped for implementation yet — a roadmap note capturing
the idea and the constraints around it before it turns into a `GEMINI-*`
prompt. Written 2026-08-17.

## The idea

Users can wager against themselves — or eventually another user — that
they'll hit a goal (e.g. "lose 10kg in 6 months"). Succeed, keep the stake.
Fail, it goes to a charity of your choice. Phase one is honor system, no
real money; the end state is real stakes, real charities, real other users,
real accountability.

## This isn't a new idea — which is useful, not discouraging

StickK has run essentially this model since ~2007: real money, an
"anti-charity" payout on failure, no gambling-law problem because you're
betting on your own effort, not chance. Beeminder, DietBet, and the old
GymPact/Pact app are variants. The differentiator isn't the concept — it's
that droppdd already tracks workouts, meals, and weight, so a wager can
resolve against real logged data instead of a bare self-report checkbox.
Lean into that explicitly; it's a genuinely better mousetrap.

## Legal shape — read before building phase 3

Not legal advice, and phase 3 specifically needs a real lawyer before
shipping. But the architecture decisions below should be made early because
they're expensive to retrofit:

- **Self-wagers vs. peer wagers are different animals.** Betting against
  your own future behavior (no chance, no house) is a commitment device,
  not gambling — that's why StickK can operate broadly. Peer-vs-peer
  real-money wagers start to resemble a skill contest / prediction market,
  which triggers state-by-state gambling regulation depending on structure.
  Keep real money scoped to solo commitment contracts for a long time;
  treat peer cash wagering as a separate, much later, "get a lawyer first"
  milestone — not the same phase as "add real money."
- **Never hold funds.** Custodying user money, even briefly, can trigger
  money-transmitter licensing. Route straight through a processor (Stripe)
  to a charity payout API rather than acting as a wallet.

## Safety — design this in from phase 1, not as a disclaimer later

A financial incentive to hit a number on a scale is a documented trigger
for disordered eating, and this is exactly the kind of feature that
attracts people already looking for a reason to push further (e.g. extended
fasting culture). Cheap to build in now, hard to retrofit once money's
involved:

- Cap how aggressive a weight-based goal can be — standard safe guidance is
  roughly 0.5–1% body weight/week.
- Bias the product toward *behavior* goals (log workouts 5x/week, hit
  protein target 80% of days) over raw outcome goals.
- Surface a gentle warning when someone sets a target outside healthy
  bounds, rather than silently accepting it.

## Phasing

1. **Solo commitment contracts, honor system, no money.** New `Wager`
   model — goal, metric, target, stake-as-a-number, start/end date, status.
   Resolution reads from existing `Progress`/`WeightRecord` data where
   possible instead of a fresh self-report field. Goal-aggressiveness
   guardrails built in from the start, not added later.
2. **Add peers, still no money.** Social accountability, maybe a "witness"
   confirmation step, before payments enter the picture at all.
3. **Real money, solo only.** Stripe + a charity payout API, no custody.
   Legal review before this ships.
4. **Peer-vs-peer real money.** Much later, if ever. Separate legal review
   from phase 3 — don't assume clearing phase 3's review covers this.

## Open questions

- Which charity payout API (every.org, Charity Navigator, a direct Stripe
  Connect setup)?
- What counts as a valid "witness" in phase 2 — another droppdd user, or
  anyone with a link?
- Does a behavior-goal wager need its own tracking granularity beyond
  what `Workout`/`Meal` logging already captures, or is it derivable from
  existing tables?
