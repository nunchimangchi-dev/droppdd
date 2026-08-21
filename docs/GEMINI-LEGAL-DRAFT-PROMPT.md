# Gemini pass: draft Privacy Policy + Terms of Service content

Read this in full before writing anything. This is content, not code — but
get the facts wrong and it's worse than not having the page at all. Every
factual claim about what droppdd does with data must be true of the actual
app, not a plausible-sounding generic SaaS default.

## What this pass is and isn't

- **Draft markdown content only.** Write `docs/legal/PRIVACY-POLICY.md` and
  `docs/legal/TERMS-OF-SERVICE.md`. Do **not** create `/privacy` or `/terms`
  routes, do not wire up an acceptance/consent flow, do not touch any
  `.ts`/`.tsx` file. Turning this into live, click-to-accept pages happens
  in a separate pass, after a human (and eventually a real lawyer,
  specifically for the wagers/stakes language) has actually reviewed this
  draft. Do not skip that framing in your own output — say explicitly in
  what you write that this is a draft pending legal review, not a finished
  legal document.
- No new dependencies, no changes to `package.json`, never touch
  `~/Projects/skyrise`.
- Work on a fresh branch off `main` (`docs/legal-draft`). Commit locally.
  **Do not push, do not open a PR.**
- Append a dated section to `HANDOFF.md`: what you wrote, what you
  researched and cited, and any open question you couldn't resolve from the
  facts given below (flag it, don't guess).

## The facts you must ground this in (don't invent, don't assume defaults)

droppdd is a **small, invite-only** fitness-tracking app — not a public
SaaS with open signup. Be honest about that scope; don't write copy that
implies a scale or maturity the product doesn't have.

- **Auth**: Google OAuth only (via Auth.js/NextAuth), gated by an
  email-allowlist a maintainer manages by hand. No password auth exists.
  Standard OAuth data is collected: email, name, Google account ID, profile
  image URL, session tokens.
- **What's stored** (Prisma/SQLite): the OAuth account/session data above;
  `Progress` (current weight, current streak); `WeightRecord` (weight
  history over time — this is health data, treat it with real weight in
  the policy, not boilerplate); `Wager` (a title, a target metric, a
  free-text "stake description" the user writes themselves, e.g. "$20 to
  Feeding America if I miss this" — **currently honor-system only, no
  payment processor is integrated, no real money changes hands through the
  app today**). `Workout`/`Exercise`/`Meal` are a shared content library,
  not user-specific data — don't conflate these with personal data.
- **No analytics or tracking library is currently integrated.** Don't write
  a cookie-consent section describing trackers that don't exist; note
  instead that none exist today and the policy will be updated if that
  changes.
- **Hosting**: self-hosted on the maintainer's own hardware, reachable only
  over Tailscale (a private network) at the maintainer's discretion, not a
  public cloud platform with its own vendor DPA. Be accurate about this —
  don't describe enterprise-cloud-style infrastructure guarantees that
  aren't true here.
- **Future, not current**: an AI-assisted meal-planning feature is planned,
  which will call the Gemini API (a third-party data processor, once
  built). A future "real money" wager tier is explicitly planned but not
  built, and per the project's own roadmap doc requires legal review before
  it ships. Both should be disclosed as *planned* future processing, not
  described as already happening.

## The one thing that needs real care: wager framing

The wagers feature has real, non-obvious legal exposure: language that
reads as **gambling/betting** (staking money on an outcome, house-adjudicated
payouts) is a meaningfully different regulatory category than a
**commitment contract** (a personal accountability tool where the user sets
their own stake and it's honor-system, no house, no payout mechanism, no
money currently changes hands through the platform at all). Use
"commitment contract" framing throughout, be precise that droppdd does not
hold funds, does not adjudicate payouts, and does not currently process any
payment — and flag in `HANDOFF.md`, explicitly, that this specific section
is the one most in need of real legal review before anything ships, not
just a readability pass.

## Research before writing

Don't write from generic legal-boilerplate memory. Search for real,
current (2026) examples of privacy policies and terms of service from
**small, self-hosted or early-stage personal-health-adjacent apps** —
not enterprise SaaS giants, whose policies imply infrastructure and legal
resources droppdd doesn't have. Also look specifically at how legitimate
**commitment-contract products** (StickK, Beeminder) word their
stakes/accountability terms, since that's the closest real precedent for
the wagers section.

**If a search returns zero or empty results, do not silently continue as
if it succeeded.** Either retry with a meaningfully different query, or
stop and say explicitly in `HANDOFF.md` that the search failed and why
proceeding without that grounding is still reasonable — never write legal
content as if research happened when it didn't. Cite what you actually
found (real product names, real specific language patterns you drew from),
same standard as prior design passes.

## What good output looks like

- Plain language over legal boilerplate where the two say the same thing —
  this is a personal project for known users, not a Fortune 500 EULA.
  Where a genuinely load-bearing legal term is needed, use it, but don't
  pad word count with default-template filler.
- Structurally complete: what's collected, why, who it's shared with (be
  honest: currently nobody but Google for auth — no ad networks, no data
  brokers, no analytics vendors), how long it's kept, how a user can ask
  for their data or ask for it deleted (state plainly that this is
  currently a manual request to the maintainer, not a self-serve button —
  that's true today, and pretending otherwise would be worse than admitting
  it, and it's already flagged as a real gap in `docs/SECURITY-BASELINE.md`
  under GDPR).
- A visible "last updated" placeholder and an explicit "this is a draft
  pending review, not yet in effect" banner at the top of both documents.

## Process

1. `git checkout main && git pull && git checkout -b docs/legal-draft`
2. Read `prisma/schema.prisma`, `src/auth.ts`, `docs/FUTURE-WAGERS.md`, and
   `docs/SECURITY-BASELINE.md` before writing anything — the facts above
   are a summary, not a substitute for reading the actual schema and
   roadmap.
3. Research real reference examples (see above), with the zero-results
   handling rule in mind.
4. Write `docs/legal/PRIVACY-POLICY.md` and `docs/legal/TERMS-OF-SERVICE.md`.
5. Commit locally, don't push.
6. Append to `HANDOFF.md`: what you wrote, what you researched and cited,
   the explicit flag on the wagers section needing real legal review, and
   any open question you couldn't resolve from the facts given here.
