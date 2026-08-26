# Gemini: peer-to-peer wager challenges

Read this in full before touching anything. This is Phase 2 of
`docs/FUTURE-WAGERS.md`'s own roadmap ("add peers, still no money") -
that doc is not hypothetical, read it, it's the design authority for
what's in and out of scope here. Today's `Wager` model is solo-only: a
user wagers against their own future data, no opponent, no accept/reject
step. This prompt adds real peer challenges - "Warren challenges Dave to
hit a streak target" - on top of the existing solo-wager system without
changing solo-wager behavior at all.

## Current state, exactly as it exists right now

- `prisma/schema.prisma`'s `Wager` model:
  ```prisma
  model Wager {
    id               Int       @id @default(autoincrement())
    userId           String
    user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)
    title            String
    metric           String // "WEIGHT_TARGET" | "STREAK_TARGET"
    startValue       Float
    targetValue      Float
    stakeDescription String
    startDate        DateTime  @default(now())
    endDate          DateTime
    status           String    @default("ACTIVE") // "ACTIVE" | "WON" | "LOST" | "CANCELLED"
    resolvedAt       DateTime?
    createdAt        DateTime  @default(now())
  }
  ```
  `User` model has `wagers Wager[]` (no relation name today - only one
  relation to `Wager` exists, so it isn't needed yet).
- `src/lib/wagers.ts`: `evaluateWager(wager, progress, now)` is a pure
  function - given a wager and a `{ currentWeight, currentStreak }`
  progress snapshot, returns `"WON" | "LOST" | "ACTIVE"`. **Do not
  change this function's logic.** It doesn't know or care whose progress
  it's checking against - that's the caller's job. This is exactly what
  makes peer resolution possible without touching resolution math at all.
- `src/app/wagers/page.tsx` is where everything lives today (no separate
  actions.ts for wagers - inline server actions in the page component,
  matching this file's existing convention, not the `actions.ts` pattern
  used by onboarding/choose-username/profile):
  - Lines ~43-58: on every page load, fetches the signed-in user's own
    `ACTIVE` wagers, calls `evaluateWager` against their own `Progress`
    row, and persists any resolution (`WON`/`LOST`) immediately. This is
    the entire "resolution engine" - there's no cron/job, it's
    check-on-view.
  - Lines ~67-121: `createWager` server action. Validates via
    `createWagerSchema` (title, metric enum, targetValue, stakeDescription,
    endDate). Always sets `userId` to the creator, always captures
    `startValue` from the **creator's own** current `Progress` at
    creation time, always sets status to the default (`ACTIVE`)
    implicitly (never sets it explicitly). Requires the creator to
    already have a `Progress` row (`"no-progress"` error if not) and
    enforces the goal-aggressiveness guardrail
    (`impliedWeeklyRatePercent`) for `WEIGHT_TARGET` loss goals.
  - Lines ~60-65: `wagers` split into `active` (status === "ACTIVE") and
    `history` (everything else) for display.
- `src/lib/username.ts` has `usernameSchema` and `checkUsernameTaken` -
  reuse `usernameSchema` for validating a challenge-target username
  lookup; you'll need a new lookup (find a user by username, not check
  if one's taken) but keep it in the same file since it's the natural
  home for username-keyed lookups.
- **Important existing consumer of the `User.wagers` relation** -
  `src/app/admin/users/page.tsx` (line ~25, `wagers: true` in a
  `findMany` include) and `src/app/admin/users/[id]/page.tsx` (line ~29,
  `wagers: { orderBy: { createdAt: "desc" } }`) both read
  `user.wagers` directly to show admin-side wager counts/lists. **Do not
  rename the `wagers` field on `User`** - it must keep meaning "wagers
  this user created", so both admin pages keep working unmodified. Prisma
  relation *names* (the `@relation("...")` string) and field names are
  independent - name the relation without renaming the field.

## What to build

1. **Schema** (`prisma/schema.prisma`):
   - `Wager.challengedUserId String?` (nullable - `null` means a solo
     wager, unchanged from today) + `challengedUser User? @relation("WagerChallenged", fields: [challengedUserId], references: [id], onDelete: Cascade)`.
   - Name the existing creator relation to disambiguate now that `User`
     has two relations to `Wager`: `user User @relation("WagerCreator", fields: [userId], references: [id], onDelete: Cascade)`.
   - On `User`: keep `wagers Wager[] @relation("WagerCreator")` (same
     field name, now named) and add `wagersChallenged Wager[] @relation("WagerChallenged")`.
   - `Wager.startValue` becomes nullable (`Float?`) - a peer challenge's
     target is proposed by the challenger, but the baseline can only be
     captured from the *challenged* user's own `Progress` once they
     accept (you can't snapshot Dave's streak before Dave agrees to it).
   - `Wager.status` default stays `"ACTIVE"` but the field now also
     accepts `"PENDING"` (challenge sent, awaiting response) and
     `"REJECTED"` (terminal, challenged user declined).
   - This is an additive, nullable-only migration - no existing row's
     `startValue` becomes invalid (all existing wagers keep their real
     `Float` value; only new peer wagers ever have `startValue: null`
     before acceptance). Same safe-migration pattern as the username
     phase - don't reset the dev database.

2. **Creating a peer challenge**: extend `createWagerSchema` /
   `createWager` (or add a clearly-separate second action if that's
   cleaner - your call, but don't duplicate the Zod field definitions
   that are identical between solo and peer) to accept an optional
   `challengeUsername` field.
   - If absent: **exactly today's behavior**, byte-for-byte. This is the
     regression-risk part of this prompt - verify it explicitly before
     calling this done.
   - If present: look up the target user by username (case-insensitive,
     same comparison approach as `checkUsernameTaken`). Validate: target
     exists, target is not the creator themselves (no self-challenges).
     Create the `Wager` with `challengedUserId` set, `status: "PENDING"`,
     `startValue: null`. The creator does **not** need their own
     `Progress` row for this path (they're not the one being measured) -
     skip the `"no-progress"` guard when challenging someone else. The
     goal-aggressiveness guardrail (`impliedWeeklyRatePercent`) still
     applies to `WEIGHT_TARGET` peer challenges, but since there's no
     `startValue` yet at creation time, you'll need to either defer that
     check to accept-time (once the challenged user's baseline is known)
     or reason about it differently - think this through and document
     your choice in `HANDOFF.md`, don't skip the safety guardrail
     silently.

3. **Accepting / rejecting a challenge**: new server action(s). Must
   verify `session.user.id === wager.challengedUserId` before allowing
   either action (a challenge is only actionable by the person it was
   sent to - this is a real authorization check, not just a UI
   affordance).
   - **Accept**: requires the challenged user to have a `Progress` row
     (same `"no-progress"`-style guard as solo creation, just checked
     here instead). Captures their current `Progress` value as
     `startValue`, sets `status: "ACTIVE"`.
   - **Reject**: sets `status: "REJECTED"`, `resolvedAt: now`. Terminal,
     no further action possible.

4. **Resolution loop extension**: the existing auto-resolve block (lines
   ~43-58) only checks wagers where `userId === session.user.id`. Extend
   it to also resolve `ACTIVE` wagers where
   `challengedUserId === session.user.id`, evaluated against the
   **viewer's own** `Progress` (already fetched at the top of the page) -
   `evaluateWager` doesn't change, you're just calling it for a second
   set of wagers with the same progress snapshot.

5. **Display** (`/wagers`): add a section for challenges - both sent
   (as challenger, `challengedUserId` set) and received (as challenged
   user), grouped by status, alongside the existing solo-wager sections.
   Received `PENDING` challenges need visible Accept/Reject controls.
   Exact layout is your call - reuse the existing wager-card styling
   patterns already in this file, don't invent a new visual language.

6. **Profile stats** (`/profile`, `src/app/profile/page.tsx`): this is
   the actual original ask - add a stats panel showing, for the
   signed-in user, counts of challenges **received**: total, accepted
   (status is `ACTIVE`, `WON`, or `LOST` - i.e., they said yes,
   regardless of outcome so far), won, lost, rejected. A simple
   `prisma.wager.groupBy` or `findMany` + in-memory count is fine at
   this scale - no need for anything fancier.

## Explicit non-goals

- **No witness/mutual-confirmation step.** `FUTURE-WAGERS.md` itself
  flags this as an open question for phase 2 ("maybe a witness
  confirmation step") - not resolved, not building it here. Resolution
  stays exactly as today: automatic, against tracked `Progress` data.
- **No new metric types.** Peer challenges use the same
  `WEIGHT_TARGET`/`STREAK_TARGET` metrics as solo wagers - confirmed
  directly with the maintainer. No free-text/custom goals (a "5k run"
  style dare isn't resolvable without new tracking infrastructure that
  doesn't exist yet - out of scope).
- **No notifications** (email/push) when challenged - visible in-app on
  `/wagers` next visit is enough for a small trusted beta.
- **No real money** - unchanged from the existing phase boundary.
- Don't touch `/admin`, `/meals`, `/workouts`, `/choose-username`, or the
  username system - unrelated to this feature.
- Don't rename `User.wagers` (see above - admin pages depend on it).

## Verification

You have no browser and cannot visually verify - say so explicitly in
`HANDOFF.md`. Manual test plan should specifically cover:
- **Regression**: an existing/new solo wager (no `challengeUsername`)
  behaves identically to before this change - same fields set, same
  status, same resolution behavior.
- Challenging a nonexistent username, or yourself, is rejected with a
  clear error.
- A challenge only appears as actionable (Accept/Reject) to the actual
  challenged user - verify the authorization check, don't just trust the
  UI hides the buttons from everyone else.
- Rejecting is terminal (no further state change possible).
- Accepting without a `Progress` row is blocked, same as solo creation.
- Profile stats counts add up correctly against a small set of test
  wagers in different states.
- `npm run build` and `npm run lint` both pass.
- Confirm the migration is additive/nullable-only and applies cleanly
  without a database reset.

## Constraints

- New branch: `git checkout -b feature/peer-wagers`.
- Commit locally. **Do not push, do not open a PR.**
- Append a dated `HANDOFF.md` section: what was built, the
  goal-aggressiveness-guardrail timing decision (creation-time vs.
  accept-time) restated and justified in your own words, the manual test
  plan, and the visual-verification caveat.

## Process

1. `git checkout -b feature/peer-wagers`
2. Read `docs/FUTURE-WAGERS.md`, `prisma/schema.prisma`'s `Wager` and
   `User` models, `src/lib/wagers.ts`, `src/app/wagers/page.tsx`, and
   `src/lib/username.ts` in full before changing anything.
3. Add the nullable schema fields + migration.
4. Extend `createWager` (or add a peer-specific action) with the
   optional challenge path.
5. Build accept/reject actions with the authorization check.
6. Extend the resolution loop to cover received challenges.
7. Update `/wagers` display for sent/received challenges.
8. Add the stats panel to `/profile`.
9. Self-check: confirm solo-wager behavior is unchanged, confirm the
   authorization check on accept/reject actually blocks a non-target
   user.
10. Commit locally on `feature/peer-wagers`, don't push.
11. Append the dated `HANDOFF.md` section.
