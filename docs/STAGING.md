# Staging environment

droppdd has a real staging deployment, separate from production in every way
that matters: separate host, separate database, separate service.

- **Host**: LXC `droppdd-staging` (VMID 102) on the Proxmox host `pveopti`
  (`192.168.10.15`), static IP `192.168.20.21` on VLAN20 — the isolated
  webserver VLAN (outbound internet + DNS to `192.168.10.1` allowed, no
  access to other internal networks). Debian 13, matching `web01`'s and
  production's base setup. Its own Tailscale node identity
  (`droppdd-staging`).
- **URL**: `https://droppdd-staging.tail2b3f17.ts.net:8443` — reachable only
  over the tailnet, same as production's `box.tail2b3f17.ts.net:8443`. Not
  public, no Cloudflare Tunnel, no public DNS.
- **Database**: its own SQLite file at `~/Projects/droppdd/prisma/dev.db`
  *on the staging host* — created via `prisma migrate deploy` and
  `prisma db seed`, never copied from production. Disposable; safe to wipe
  and reseed at any time.
- **Auth**: same Google OAuth client as production (client ID/secret
  reused), with `https://droppdd-staging.tail2b3f17.ts.net:8443/api/auth/callback/google`
  added as a second authorized redirect URI. Allowlist seeded with
  `nunchimangchi@icloud.com` via `ALLOWED_EMAILS` at seed time.
- **Service**: `systemd --user` unit at
  `~/.config/systemd/user/droppdd.service` on the staging host, running as
  user `farmer` (linger enabled so it survives without an active login
  session) — same shape as production's unit, `AUTH_URL` set in the unit's
  own `Environment=`, not the shared `.env`.

## Deploying a branch/commit to staging

There's no CI/CD pipeline for this yet — it's a manual step run by whoever
is testing a change. From box (or anywhere with SSH access to the Proxmox
host):

```bash
ssh root@192.168.10.15 "pct exec 102 -- su - farmer -c '
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
curl -sk -o /dev/null -w '%{http_code}\n' https://droppdd-staging.tail2b3f17.ts.net:8443/
curl -sk https://droppdd-staging.tail2b3f17.ts.net:8443/api/auth/providers
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
production. At the time staging was set up, `box`'s local `main` was one
commit ahead of `origin/main` (unpushed) — push local `main` before
expecting staging (or a fresh production redeploy) to reflect the latest
local work.
