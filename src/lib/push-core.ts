// Delivery rules for web push, with the web-push client and the database
// injected so they can be tested without network or a DB (see
// push-core.test.ts). The real bindings live in src/lib/push.ts.

// The only shape a notification may have. Keep it generic: no health,
// weight, streak or food data in here, ever.
export interface PushPayload {
  title: string;
  body: string;
  url: string;
}

export interface StoredSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface WebPushClient {
  sendNotification(
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    payload: string,
    options?: { TTL?: number; timeout?: number }
  ): Promise<unknown>;
}

export interface SubscriptionStore {
  list(userId: string): Promise<StoredSubscription[]>;
  remove(id: string): Promise<void>;
  markSuccess(id: string): Promise<void>;
  /** Increments the consecutive failure counter and returns the new value. */
  recordFailure(id: string): Promise<number>;
}

export const MAX_CONSECUTIVE_FAILURES = 5;

export interface SendResult {
  sent: number;
  removed: number;
  failed: number;
}

function statusCodeOf(err: unknown): number | null {
  if (typeof err === "object" && err !== null && "statusCode" in err) {
    const code = (err as { statusCode: unknown }).statusCode;
    return typeof code === "number" ? code : null;
  }
  return null;
}

export function createPushSender(client: WebPushClient, store: SubscriptionStore) {
  return async function sendToUser(userId: string, payload: PushPayload): Promise<SendResult> {
    // Rebuild the payload so nothing beyond {title, body, url} can leak in.
    const body = JSON.stringify({ title: payload.title, body: payload.body, url: payload.url });
    const result: SendResult = { sent: 0, removed: 0, failed: 0 };
    const subs = await store.list(userId);

    for (const sub of subs) {
      try {
        await client.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
          { TTL: 60 * 60, timeout: 10_000 }
        );
        await store.markSuccess(sub.id);
        result.sent++;
      } catch (err) {
        const status = statusCodeOf(err);
        if (status === 404 || status === 410) {
          // The push service says this subscription is gone for good.
          await store.remove(sub.id);
          result.removed++;
          continue;
        }
        const failures = await store.recordFailure(sub.id);
        if (failures >= MAX_CONSECUTIVE_FAILURES) {
          await store.remove(sub.id);
          result.removed++;
        } else {
          result.failed++;
        }
      }
    }
    return result;
  };
}
