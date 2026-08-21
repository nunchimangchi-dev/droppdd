# Security & compliance baseline

This exists because droppdd's first security review (2026-08-21) found a
consistent pattern: everything that turned out fine did so because of good
tooling defaults or a fix bolted on during unrelated feature work — not
because of a deliberate standard applied at project start. This doc is that
standard, made explicit, so the next project (and droppdd's next feature)
doesn't have to rediscover the same gaps by accident.

Two tiers: things every new skyrise-built project should have from its first
commit, and things that must be true before a project goes from
tailscale-only/allowlisted to actually public.

## Day-one baseline (every project, from the start)

- **Schema-validate every Server Action / API route input.** Client-side
  `<select>`/`required` constraints are UX, not security — anyone can POST
  directly to the action. Use Zod (or equivalent) at the boundary; never pass
  `formData.get()` straight into a DB call.
- **Ownership is always session-derived, never client-supplied.** Every
  query scoped to a user must get `userId` from the server-side session
  (`await auth()`), not from a client-passed field or URL param. The moment
  a route fetches an object *by ID* on behalf of a specific user, that route
  needs an explicit `where: { id, userId }` check — don't assume "it's fine,
  nothing exploits it yet" carries forward when new routes get added.
- **`.env*` gitignored from the first commit**, not added after a scare.
  Never `NEXT_PUBLIC_*` (or framework equivalent) for anything that isn't
  meant to be world-readable in the browser bundle.
- **Lockfile committed, CI installs with `npm ci` (not `npm install`), and
  `npm audit --audit-level=critical` runs in CI.** Critical, not high — see
  the note in droppdd's `ci.yml` for why the bar isn't set at "high": a real
  finding can require a breaking-change fix that needs human judgment, and a
  gate that blocks CI on every high-severity transitive finding trains
  everyone to ignore it.
- **ORM/parameterized queries only.** No raw SQL string-building. If a raw
  query ever becomes necessary, it gets a second pair of eyes, specifically
  for injection.

## Launch gates (required before going public / handling real money)

Not needed for a tailscale-only, allowlisted app used by a handful of known
people. Required before that changes.

- **Rate limiting** on auth, password/session flows, and any LLM/email/SMS
  endpoint.
- **Real staging environment** — a separate deploy, separate database, not
  "push to main and hope." (For droppdd specifically: now cheap to build,
  given the Proxmox + Cloudflare Tunnel + cert automation infra already
  exists from the homelab work — see the staging-setup session.)
- **Privacy Policy + Terms**, with an actual acceptance flow — not a
  template nobody reads, not a page that exists but was never linked from
  sign-up.
- **GDPR baseline**: a real "export my data" and "delete my account" path,
  and consent-gating before any analytics library fires.
- **PII-shape review** on any newly-public-facing API/page response —
  specifically triggered the moment a feature shows one user data belonging
  to another user (droppdd: this is wagers Phase 2, peer wagers).
- **Backups that have actually been restore-tested**, not backups that
  merely run. (See droppdd's status below — this one's done.)
- **Error tracking / monitoring wired in before the first public user**, not
  after the first incident makes it obvious it's needed.

## droppdd's current status against this (as of 2026-08-21)

| Item | Status |
|---|---|
| Zod validation on Server Actions | Done for `createWager` (first instance of the pattern) — other actions should follow the same shape as they're touched |
| Session-derived ownership scoping | Already correct everywhere it applies; **re-verify explicitly** when Phase 2 peer wagers adds any fetch-by-ID-for-another-user route |
| `.env*` gitignored | Already correct |
| Lockfile + `npm ci` + audit gate | Lockfile and `npm ci` already correct; audit gate added 2026-08-21 (see `ci.yml` comment re: the tracked deepmerge-ts/Prisma finding) |
| ORM-only queries | Already correct (Prisma throughout, no raw SQL found) |
| Backup restore-tested | Verified 2026-08-21 — real rows, passed `PRAGMA integrity_check`, confirmed against the latest nightly snapshot |
| Rate limiting | Not started |
| Staging environment | Done 2026-08-21 — separate LXC (`droppdd-staging`, VLAN20, isolated), separate seeded SQLite DB, own systemd service, own Tailscale HTTPS URL. See `docs/STAGING.md`. |
| Privacy Policy + Terms | Not started — `FUTURE-WAGERS.md` already flags this as required before Phase 3 (real money) |
| GDPR export/delete | Not started |
| Error tracking | Not started |
| Known accepted risk | `deepmerge-ts` high-severity finding via `@prisma/config`; fix requires downgrading Prisma to 6.x, not taken unreviewed. Revisit when upstream patches land. |
