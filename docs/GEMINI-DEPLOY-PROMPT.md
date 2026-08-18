# Gemini CLI task: persistent deployment

Interactive `gemini`, not `-p` (headless can't run shell/write files here).
Run from inside `~/Projects/droppdd` on a fresh branch off `main`
(`cd ~/Projects/droppdd && git checkout main && git pull && git checkout -b
feat/deploy && gemini`), `/model` to something other than
`gemini-3.5-flash`/`gemini-3-flash` (both have hit free-tier caps before —
`gemini-3-flash-preview` is confirmed working), then paste this prompt.

---

You are working in the `droppdd` repo, on a new branch off `main`. The app
is fully built (dashboard, workouts, meals, progress, Google OAuth +
allowlist) but has never been deployed persistently — every verification
pass so far has meant a human manually running `npm run start` and
temporarily pointing `tailscale serve` at it. Your job is to give it a real
home: a `systemd --user` service plus its own `tailscale serve` slot, the
same pattern already used for the skyrise dashboard.

Read `~/Projects/skyrise/dashboard/learn/tailscale.html` and
`~/Projects/skyrise/dashboard/data/progress.json`'s `tailscale-dashboard`
phase first — that's the exact template to follow. Also read the existing
unit at `~/.config/systemd/user/skyrise-dashboard.service` for the concrete
pattern. **Do not modify anything under `~/Projects/skyrise` — read-only
reference, this task is scoped to droppdd and this host's systemd/tailscale
config only.**

## Prerequisites — already done, don't redo these

- The Google OAuth client's authorized redirect URIs already include
  `https://box.tail2b3f17.ts.net:8443/api/auth/callback/google` (added
  ahead of time specifically for this deployment). Don't touch the OAuth
  client config.
- `.env` in `~/Projects/droppdd` already has `AUTH_GOOGLE_ID`,
  `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`, `AUTH_TRUST_HOST`. Verify they're
  still there; if any are missing, stop and report rather than inventing
  values (same rule as the auth-phase prompt).

## What to build

Locked-in config — don't improvise different ports or paths:

- droppdd's Next.js server listens locally on **port 3001** (the dashboard
  owns 8787, don't collide with it).
- `tailscale serve` publishes it on **port 8443** externally
  (`https://box.tail2b3f17.ts.net:8443/`) — a different port from the
  dashboard's default-443 root, so both can run simultaneously without one
  displacing the other. Use `tailscale serve --https=8443 3001`, **not**
  `tailscale serve --bg` (which targets port 443 and would fight with the
  dashboard).

Steps:

1. **Build for production.** `npm run build` in `~/Projects/droppdd`. Confirm
   it's clean before wiring up the service — a systemd unit that starts a
   broken build is worse than no unit.
2. **Systemd unit.** Create `~/.config/systemd/user/droppdd.service`,
   following `skyrise-dashboard.service`'s shape: `WorkingDirectory` set to
   `%h/Projects/droppdd`, `Restart=on-failure`, `WantedBy=default.target`.
   For `ExecStart`, don't just assume `npm`/`node` are on systemd's default
   PATH — check with `which node` and `which npm` first, and either set an
   explicit `Environment=PATH=...` in the unit or use absolute paths in
   `ExecStart`. This exact class of bug (works when a human runs it
   interactively, breaks silently under systemd because the PATH is
   different) has bitten this project before during CI — verify this
   doesn't repeat here rather than assuming it'll just work.
   `ExecStart` should run production `next start` on port 3001 (e.g.
   `npm run start -- -p 3001`, adjusted for whatever absolute-path form you
   land on).
3. **Enable + start it.** `systemctl --user daemon-reload`,
   `systemctl --user enable --now droppdd.service`. Then actually verify
   it's serving — `curl -s -o /dev/null -w '%{http_code}\n'
   http://127.0.0.1:3001/` should redirect (unauthenticated → `/signin`),
   not connection-refused or 500. Check `journalctl --user -u droppdd -n
   50` if it doesn't come up clean.
4. **Publish over the tailnet.** `tailscale serve --https=8443 3001`, then
   `tailscale serve status` to confirm both the dashboard's 443 mapping and
   droppdd's new 8443 mapping show up simultaneously — this is the check
   that actually proves you didn't displace the dashboard.
5. **Production `AUTH_URL`.** This is the one env var that must **not** go
   in the shared `~/Projects/droppdd/.env` (would break local
   `localhost:3000` dev testing — see `HANDOFF.md`'s auth-phase section for
   why). Set it in the systemd unit's own `Environment=` directive instead:
   `Environment=AUTH_URL=https://box.tail2b3f17.ts.net:8443/api/auth`.
   Restart the service after adding it.
6. **Real end-to-end check.** You don't have a browser, so you can't click
   through a real Google sign-in — that's expected, note it as unverified
   rather than claiming you tested it. But do verify with `curl` that
   `https://box.tail2b3f17.ts.net:8443/` (from this host, over the tailnet)
   returns a redirect to `/signin`, and that
   `https://box.tail2b3f17.ts.net:8443/api/auth/providers` returns the
   Google provider — that confirms the whole chain (systemd → tailscale
   serve → Next.js → Auth.js config) is wired correctly even without a
   real login.

## Explicit boundaries — do not cross these

- Don't touch `~/Projects/skyrise` at all — read the dashboard's existing
  unit/docs for reference, don't modify anything there.
- Don't touch the Google OAuth client config — already done.
- Don't add a rebuild step inside the systemd unit itself (no
  `ExecStartPre=npm run build`) — keep the unit just running the already-built
  app. Note in the handoff that future deploys need `npm run build &&
  systemctl --user restart droppdd` after pulling new code; don't try to
  automate that as part of this task.
- Don't touch application code, Prisma schema, or auth logic.
- Don't modify `.github/workflows/ci.yml`.
- Work on a new branch (`feat/deploy`). Commit locally with clear messages.
  **Do not `git push`. Do not open a PR.** Note: most of this task's real
  output is host config (systemd unit, tailscale serve state), not repo
  files — that's fine, it doesn't all need to land in a commit. Commit
  whatever repo-tracked changes make sense (if any) and describe the
  host-level steps in the handoff instead.

## Before you finish

Confirm: `npm run lint` and `npm run build` still pass, the systemd service
is enabled and running (`systemctl --user status droppdd`), `tailscale
serve status` shows both the dashboard and droppdd mappings, and the two
`curl` checks in step 6 both succeed.

## Handoff

Append a new section to `HANDOFF.md` covering:

- The exact systemd unit content you landed on, and what PATH/node/npm
  resolution approach you used and why.
- Confirmation of the `curl` checks from step 6.
- The redeploy procedure for future code changes (build + restart).
- Explicitly note that a real end-to-end Google sign-in against the new
  deployed URL was **not** verified by you — needs a human with a browser.

Then stop.
