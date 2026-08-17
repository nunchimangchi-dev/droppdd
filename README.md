# droppdd

Aggressive fitness tracking and coaching: keto, one meal a day (OMAD),
guided workouts, and progress tracking. Future direction: commitment
contracts — wager against yourself (or eventually another user) on a goal,
with real accountability on the line. See
[docs/FUTURE-WAGERS.md](docs/FUTURE-WAGERS.md) for that roadmap — "put your
money where your mouth is," done properly.

## What's here

- **Dashboard** — today's snapshot: OMAD status, streak, weight trend,
  workout-of-the-day.
- **Workouts** — a list of guided workouts, each with a detail page and an
  interactive tracker (set completion, rest timer).
- **Meals** — keto/OMAD meal ideas with nutrition info and prep steps.
- **Progress** — weight/streak history.

Data is persisted through Prisma against SQLite — not mock data. Auth
(Google OAuth, allowlist-gated) is in progress on a separate branch.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Prisma 7
(SQLite via `@prisma/adapter-better-sqlite3`), ESLint, npm.

## Development

```sh
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `npm install` also
regenerates the Prisma client automatically (`postinstall`).

## Status

- App shell (dashboard, workouts, meals, progress) — done.
- Prisma/SQLite data layer — done.
- Auth (Google OAuth + allowlist) — in progress.
- AI-assisted meal planning, real-money wagers — planned, not started. See
  [`HANDOFF.md`](HANDOFF.md) and [`docs/FUTURE-WAGERS.md`](docs/FUTURE-WAGERS.md).

## How this gets built

Implementation passes are driven by structured prompts pasted into an AI
coding CLI (see `docs/GEMINI-*-PROMPT.md` — each one scopes exactly what a
pass should and shouldn't touch), with a separate review/debugging pass
afterward that reads the diff, runs it for real, and fixes what's actually
broken rather than trusting a green build blindly. A few real bugs have
been caught and fixed that way already — see the commit history and
`HANDOFF.md` for specifics (a `.gitignore` path bug that would've committed
the generated Prisma client, and two separate CI failures from assumptions
that only held on a machine with stale build artifacts already on disk).

It exists first as the validation case for
[skyrise](https://github.com/nunchimangchi-dev/skyrise), proving the dev
environment/toolchain end to end on a real project.
