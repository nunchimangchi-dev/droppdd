import { test } from "node:test";
import assert from "node:assert/strict";
import { createPushSender, type StoredSubscription } from "./push-core.ts";

const payload = { title: "T", body: "B", url: "/checkin" };

function setup(
  subs: StoredSubscription[],
  send: (endpoint: string, body: string) => Promise<unknown>
) {
  const calls: string[] = [];
  const failures = new Map<string, number>();
  const store = {
    list: async () => subs,
    remove: async (id: string) => void calls.push(`remove:${id}`),
    markSuccess: async (id: string) => {
      failures.set(id, 0);
      calls.push(`success:${id}`);
    },
    recordFailure: async (id: string) => {
      const n = (failures.get(id) ?? 0) + 1;
      failures.set(id, n);
      calls.push(`failure:${id}:${n}`);
      return n;
    },
  };
  const client = { sendNotification: async (s: { endpoint: string }, p: string) => send(s.endpoint, p) };
  return { sendToUser: createPushSender(client, store), calls };
}

const sub = (id: string): StoredSubscription => ({ id, endpoint: `https://push.example/${id}`, p256dh: "k", auth: "a" });

test("success marks the subscription and sends only {title, body, url}", async () => {
  let sentBody = "";
  const { sendToUser, calls } = setup([sub("a")], async (_e, b) => void (sentBody = b));
  const dirty = { ...payload, weight: 200, streak: 9 } as typeof payload;
  const r = await sendToUser("u1", dirty);
  assert.deepEqual(r, { sent: 1, removed: 0, failed: 0 });
  assert.deepEqual(calls, ["success:a"]);
  assert.deepEqual(Object.keys(JSON.parse(sentBody)).sort(), ["body", "title", "url"]);
});

for (const statusCode of [404, 410]) {
  test(`HTTP ${statusCode} deletes the subscription on first failure`, async () => {
    const { sendToUser, calls } = setup([sub("a")], async () => {
      throw Object.assign(new Error("gone"), { statusCode });
    });
    const r = await sendToUser("u1", payload);
    assert.deepEqual(r, { sent: 0, removed: 1, failed: 0 });
    assert.deepEqual(calls, ["remove:a"]);
  });
}

test("other failures increment the counter and delete on the 5th consecutive", async () => {
  const { sendToUser, calls } = setup([sub("a")], async () => {
    throw Object.assign(new Error("boom"), { statusCode: 500 });
  });
  for (let i = 1; i <= 4; i++) {
    const r = await sendToUser("u1", payload);
    assert.deepEqual(r, { sent: 0, removed: 0, failed: 1 });
  }
  assert.ok(!calls.some((c) => c.startsWith("remove")));
  const r = await sendToUser("u1", payload);
  assert.deepEqual(r, { sent: 0, removed: 1, failed: 0 });
  assert.equal(calls.at(-1), "remove:a");
});

test("errors without a status code (network) count as failures", async () => {
  const { sendToUser, calls } = setup([sub("a")], async () => {
    throw new Error("ECONNRESET");
  });
  await sendToUser("u1", payload);
  assert.deepEqual(calls, ["failure:a:1"]);
});

test("one bad subscription does not stop the others", async () => {
  const { sendToUser, calls } = setup([sub("a"), sub("b")], async (e) => {
    if (e.endsWith("/a")) throw Object.assign(new Error("gone"), { statusCode: 410 });
  });
  const r = await sendToUser("u1", payload);
  assert.deepEqual(r, { sent: 1, removed: 1, failed: 0 });
  assert.deepEqual(calls, ["remove:a", "success:b"]);
});

test("a user with no subscriptions gets nothing", async () => {
  const { sendToUser } = setup([], async () => assert.fail("should not send"));
  assert.deepEqual(await sendToUser("u1", payload), { sent: 0, removed: 0, failed: 0 });
});
