# Staging environment

droppdd has a real staging deployment, separate from production in every way
that matters: separate host, separate database, separate service.

- **Host**: a dedicated LXC on the Proxmox host, with a static IP on an
  isolated webserver VLAN — outbound internet and DNS only, no access to other
  internal networks. Debian 13, matching production's base setup. Its own
  Tailscale node identity.
- **URL**: `https://<staging-host>.<tailnet>.ts.net:8443` — reachable only over
  the tailnet, the same shape as production. Not public, no Cloudflare Tunnel,
  no public DNS. (Specific hostnames and addresses are deliberately not
  recorded here; they are in the operator's own notes.)
- **Database**: its own SQLite file at `~/Projects/droppdd/prisma/dev.db`
  *on the staging host* — created via `prisma migrate deploy` and
  `prisma db seed`, never copied from production. Disposable; safe to wipe
  and reseed at any time.
- **Auth**: Google OAuth. Staging has **its own OAuth client**, separate from
  production's, with only the staging callback registered on it. Allowlist
  seeded with the owner's address via `ALLOWED_EMAILS` at seed time; the real
  value lives in the environment, not in this document.

  Until 2026-09-24 staging shared production's client, so a compromise of this
  disposable host reached a credential production also depended on. Separated
  and verified end to end: the running app's OAuth redirect now carries the
  staging client id.

  This document previously claimed the staging callback had been "added as a
  second authorized redirect URI" on production's client. It never had been.
  Checking the console found three entries, none of them staging's — which
  also means staging sign-in could not have worked through the shared client.
  A doc asserting something the system does not do is worse than no doc.
- **Service**: `systemd --user` unit at
  `~/.config/systemd/user/droppdd.service` on the staging host, running as
  user `farmer` (linger enabled so it survives without an active login
  session) — same shape as production's unit, `AUTH_URL` set in the unit's
  own `Environment=`, not the shared `.env`.

## Deploying a branch/commit to staging

There's no CI/CD pipeline for this yet — it's a manual step run by whoever
is testing a change. From the workstation (or anywhere with SSH access to the Proxmox
host):

```bash
ssh root@<proxmox-host> "pct exec <staging-vmid> -- su - farmer -c '
  set -e
  cd ~/Projects/droppdd
  git fetch origin
  git checkout <branch-or-commit>
  git pull origin <branch>   # skip if you checked out a specific commit
  npm ci
  npx prisma migrate deploy
  npm run build
  systemctl --user restart droppdd.service
'"
```

Then verify:

```bash
curl -sk -o /dev/null -w '%{http_code}\n' https://<staging-host>.<tailnet>.ts.net:8443/
curl -sk https://<staging-host>.<tailnet>.ts.net:8443/api/auth/providers
```

The first should redirect (unauthenticated → `/signin`); the second should
list the `google` provider.

To reseed the demo data (workouts/meals) without touching real sign-in
data, rerun `npx prisma db seed` — it clears and reseeds `Workout`/`Meal`
and upserts `ALLOWED_EMAILS` without touching existing `User`/`Progress`
rows. To wipe staging completely, delete `prisma/dev.db` and rerun migrate
deploy + seed from scratch.

## What staging is for / not for

- For: testing a branch against a real build + real Google sign-in flow
  before it goes to `main` → production, without touching production's
  database or session state.
- Not for: load testing, or anything that assumes staging's data will
  persist — it's reseeded/wiped freely.

## Known gap

Staging builds from `origin/main` (GitHub), same as the objective for
production. At the time staging was set up, the workstation's local `main` was one
commit ahead of `origin/main` (unpushed) — push local `main` before
expecting staging (or a fresh production redeploy) to reflect the latest
local work.
