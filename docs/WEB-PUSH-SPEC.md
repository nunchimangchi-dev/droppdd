# Web push (PWA tier 3) spec

Status: decisions settled 2026-10-16, ready to build. Nothing here is built. Tier 1 (installable PWA) shipped to prod on 2026-10-16 (`b5d292a`).

## Goal

Opted-in users on an installed iPhone (or any browser that supports it) get two notifications and nothing else:

1. **Daily check-in reminder** at a time they choose, only if they have not checked in yet.
2. **Wager challenge received**, when another user creates a PENDING peer wager against them.

Out of scope here: the V2 notification dial (frequency levels), streak-at-risk nudges, squad or chat notifications, email fallback, native push (APNs). The data model below is built so the dial can be added later without a rewrite.

## Decisions already made

- Web push through the installed PWA, no native app, no Apple Developer account. iOS delivers web push only to a PWA added to the home screen (iOS 16.4 and later).
- Opt-in only. Nothing is sent to a user who has not explicitly enabled it.
- Notification text is generic. No health, weight, streak or food data in a payload.
- Separate VAPID keys per environment (local, staging, prod). A subscription is bound to the public key that created it, so staging and prod keys must never be shared.

## Decisions (settled 2026-10-16, Warren)

1. **Day boundary: keep UTC day semantics unchanged.** The reminder uses the same "has a check-in for the current UTC day" predicate the app uses everywhere (`src/lib/streak.ts`, `src/lib/ai-limits.ts`). Reminder times a user can choose are restricted to the window where that predicate matches their local day (for a Pacific user, roughly local morning through mid-afternoon), with a note in the UI. No streak, wager, rest-day or AI-cap behavior changes. The real fix, a per-user timezone with local-midnight day boundaries, is separate future work.
2. **No default reminder time.** The user picks a time when enabling reminders, which is also the consent moment.
3. **Wager-challenge notification is in this tier.** One call at the end of `createWager`.
4. **VAPID subject is the site URL**, `https://droppdd.alwaysgivealwaysget.com`. It is a plain string in the push token, not something to generate or register. The VAPID key pairs are generated on each host (see Secrets).

## Data model (one migration)

```
model PushSubscription {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  endpoint    String   @unique
  p256dh      String
  auth        String
  userAgent   String?
  createdAt   DateTime @default(now())
  lastSuccessAt DateTime?
  failureCount  Int    @default(0)
}

model NotificationPreference {
  userId          String   @id
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  reminderEnabled Boolean  @default(false)
  reminderHourUtc Int?     // 0-23, the hour (UTC) the reminder fires; UI converts from local time
  wagerEnabled    Boolean  @default(false)
  lastReminderSentOn String? // "YYYY-MM-DD" UTC date, dedupe: at most one reminder per UTC day
  updatedAt       DateTime @updatedAt
}
```

Add the two back-relations on `User`. Additive only: no existing column changes, so the migration is safe to run on prod after review.

## Components

1. **Service worker** `public/sw.js`, scope `/`.
   - `push` event: parse JSON `{title, body, url}`, always call `showNotification` (iOS revokes subscriptions that receive pushes without showing a notification, so no silent pushes).
   - `notificationclick`: focus an existing window or open `url` (default `/checkin`).
   - No caching, no fetch handler. Not an offline strategy.
   - Serve it with `Cache-Control: no-cache` (add a `headers()` entry in `next.config.ts`) so updates ship. Exclude `sw.js` from the auth redirect matcher in `src/proxy.ts`, the same way the manifest and icons were excluded in tier 1.
2. **Client subscribe flow** (a component on `/profile`).
   - Show the control only when the browser has `PushManager` and `Notification`.
   - On iOS Safari outside the installed app (`display-mode: standalone` false), show "Add to Home Screen first" guidance instead of a button.
   - The permission prompt fires only from a tap. `Notification.permission === "denied"` cannot be re-prompted: show how to re-enable in system settings.
   - On grant: register the SW, `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`, POST the subscription JSON.
   - UI: on/off for reminders with a local time picker (converted to `reminderHourUtc`), on/off for wager challenges, a "send me a test notification" button, and a list of this user's devices with remove.
3. **API routes** (all require a signed-in session except the cron route).
   - `POST /api/push/subscribe`: validate with zod (endpoint must be `https`, keys non-empty and bounded length), upsert by `endpoint`, attach to the session user. Reject cross-origin requests by checking `Origin` against `AUTH_URL`'s origin.
   - `POST /api/push/unsubscribe`: delete by endpoint, only if it belongs to the session user.
   - `POST /api/push/test`: send one test notification to the current user's subscriptions. Rate limit: one per minute per user.
   - `POST /api/push/cron`: reminder sender, bearer-token auth (see below).
4. **Sender library** `src/lib/push.ts`, using the `web-push` package.
   - `sendToUser(userId, payload)`: loops the user's subscriptions, on HTTP 404 or 410 deletes the subscription, on other failures increments `failureCount` and deletes after 5 consecutive failures, on success sets `lastSuccessAt` and resets the counter.
   - Payload is `{title, body, url}` only.
5. **Pure scheduling function** `src/lib/reminder-schedule.ts`: `shouldSendReminder({ nowUtc, reminderHourUtc, hasCheckInToday, lastReminderSentOn })` returns boolean. No imports, so it can be unit tested with `node --test` (Node 22 here, which can run it with type stripping; confirm against the actual node version in the cloud sandbox). Rules: fires only in the user's chosen UTC hour, never if already checked in for the current UTC day, never if `lastReminderSentOn` equals today's UTC date.
6. **Reminder trigger.** A systemd user timer on the prod host runs every 15 minutes and calls `POST /api/push/cron` on localhost with a bearer token. This reuses the existing pattern in `src/app/api/metrics/nunchi-board/route.ts` (token from the environment, constant-time compare, `/api` already excluded from the session redirect). The route selects users with `reminderEnabled` and a subscription, applies `shouldSendReminder`, sends, then writes `lastReminderSentOn`. The timer is created enabled, and a retired timer is deleted, per the pause-means-disable rule.
7. **Wager challenge hook.** At the end of `createWager`, when a challenged user exists and has `wagerEnabled`, call `sendToUser(challengedUserId, { title: "New challenge", body: "Someone challenged you. Open DROPPDD to respond.", url: "/wagers" })`. Fire and forget: a push failure must never fail or delay wager creation.

## Secrets and environment

- Generate keys on the target host with `npx web-push generate-vapid-keys`, write them straight into that environment's `.env` (mode 600). Never print them, paste them in chat, or commit them.
- `VAPID_PRIVATE_KEY` (server only), `VAPID_PUBLIC_KEY` and `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (public), `VAPID_SUBJECT`, `PUSH_CRON_TOKEN`.
- Staging gets its own set. Local dev gets its own, or runs with push disabled when the variables are absent (the UI hides the control).

## Acceptance criteria

1. A signed-in user on an installed iPhone PWA can enable reminders, choose a time, and receive the permission prompt only after tapping.
2. The test button delivers a notification within about 10 seconds on a real iPhone.
3. At the chosen hour, a user who has not checked in for the current UTC day receives exactly one reminder; a user who has checked in receives none; a second timer run in the same day sends nothing.
4. A user who has not opted in, or who removed their device, receives nothing.
5. Tapping a notification opens `/checkin` (reminder) or `/wagers` (challenge) in the installed app.
6. A challenged user with wager notifications enabled receives a push when a peer wager is created, and wager creation still succeeds if the push provider errors.
7. A dead subscription (404 or 410) is deleted on first failure.
8. `/api/push/cron` returns 401 without the bearer token, and the subscribe and test routes return 401 without a session.
9. Notification payloads contain no health, weight, streak or food data.
10. Unit tests for `shouldSendReminder` pass, including the already-checked-in, already-sent-today and wrong-hour cases.
11. `npm run lint` and `npm run build` pass. The migration is additive and applies cleanly to a copy of the prod database.

## Build split

- **Cloud-session suitable (public repo, no secrets):** `reminder-schedule.ts` with its tests, `sw.js`, the client subscribe component, the routes and `push.ts` against a mocked `web-push`, the Prisma migration generated against a throwaway local SQLite file. The PR must include the generated migration folder for review.
- **Local only:** VAPID key generation and `.env`, the systemd timer and cron token, `prisma migrate deploy` on staging and prod (ask before running, same as always), real-device testing, and deploys.

## Rollout

1. Cloud session produces the PR, reviewed locally against the acceptance criteria.
2. Staging: new VAPID keys, migrate, deploy, test on a real iPhone including the reminder timer.
3. Prod: review the migration, generate prod keys, deploy, create the timer, enable for Warren only first, then open the control to everyone.

## Risks and unknowns

- iOS delivery is best effort and timing is not guaranteed. A reminder may arrive late.
- Installed-PWA storage on iOS is separate from Safari: users re-subscribe if they reinstall.
- Option A for the day boundary is a compromise. It keeps the existing streak behavior intact, and the real fix (a user timezone) is a separate piece of work.
- Not checked: how many beta users are on iPhone versus Android or desktop. The feature works on all of them where the browser supports push, but only iPhone was in the earlier test.

## Effort

About 1.5 to 2 days: roughly half a day for the service worker, subscribe UI and routes, half a day for the sender, scheduling function, timer and tests, and the rest for the migration, staging device testing and prod rollout.
