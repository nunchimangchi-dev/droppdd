import webpush from "web-push";
import { prisma } from "@/lib/prisma";
import { createPushSender, type PushPayload } from "@/lib/push-core";

// Push is off unless every key is present. The UI and routes hide
// themselves when this is false. Keys come from the environment only.
export function isPushConfigured(): boolean {
  return Boolean(
    process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_PUBLIC_KEY &&
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_SUBJECT
  );
}

let vapidReady = false;
function ensureVapid() {
  if (vapidReady) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  vapidReady = true;
}

const send = createPushSender(
  { sendNotification: (sub, payload, options) => webpush.sendNotification(sub, payload, options) },
  {
    list: (userId) =>
      prisma.pushSubscription.findMany({
        where: { userId },
        select: { id: true, endpoint: true, p256dh: true, auth: true },
      }),
    remove: async (id) => {
      await prisma.pushSubscription.deleteMany({ where: { id } });
    },
    markSuccess: async (id) => {
      await prisma.pushSubscription.updateMany({
        where: { id },
        data: { lastSuccessAt: new Date(), failureCount: 0 },
      });
    },
    recordFailure: async (id) => {
      await prisma.pushSubscription.updateMany({
        where: { id },
        data: { failureCount: { increment: 1 } },
      });
      const row = await prisma.pushSubscription.findUnique({
        where: { id },
        select: { failureCount: true },
      });
      return row?.failureCount ?? 0;
    },
  }
);

/**
 * Sends a notification to every device the user registered. Never throws:
 * callers (wager creation, the cron route) must not be affected by a push
 * failure. Resolves with zero counts when push is not configured.
 */
export async function sendToUser(userId: string, payload: PushPayload) {
  const empty = { sent: 0, removed: 0, failed: 0 };
  if (!isPushConfigured()) return empty;
  try {
    ensureVapid();
    return await send(userId, payload);
  } catch (err) {
    console.error("push: sendToUser failed", err instanceof Error ? err.message : "unknown error");
    return empty;
  }
}

/**
 * Tells a challenged user about a new peer wager, if they opted in. Meant to
 * be called without await (fire and forget): it never throws and never
 * blocks wager creation.
 */
export async function notifyWagerChallenge(challengedUserId: string): Promise<void> {
  try {
    if (!isPushConfigured()) return;
    const pref = await prisma.notificationPreference.findUnique({
      where: { userId: challengedUserId },
      select: { wagerEnabled: true },
    });
    if (!pref?.wagerEnabled) return;
    await sendToUser(challengedUserId, {
      title: "New challenge",
      body: "Someone challenged you. Open DROPPDD to respond.",
      url: "/wagers",
    });
  } catch (err) {
    console.error("push: wager notification failed", err instanceof Error ? err.message : "unknown error");
  }
}

export type { PushPayload };
