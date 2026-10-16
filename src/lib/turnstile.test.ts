import { afterEach, beforeEach, describe, mock, test } from "node:test";
import assert from "node:assert/strict";
import { verifyTurnstile } from "./turnstile.ts";

const TEST_SECRET = "1x0000000000000000000000000000000AA";
const FAKE_SECRET = "fake-secret-for-tests";
const ENV_KEYS = ["TURNSTILE_SECRET", "TURNSTILE_HOSTNAMES"] as const;

const realFetch = globalThis.fetch;
const savedEnv: Record<string, string | undefined> = {};

type FetchCall = { url: string; init: RequestInit };
let calls: FetchCall[] = [];

function mockFetch(handler: () => Promise<Response> | Response) {
  calls = [];
  globalThis.fetch = (async (url: unknown, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return handler();
  }) as typeof fetch;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

beforeEach(() => {
  for (const k of ENV_KEYS) savedEnv[k] = process.env[k];
  process.env.TURNSTILE_SECRET = FAKE_SECRET;
  process.env.TURNSTILE_HOSTNAMES = "app.example.test, other.example.test";
  // Nothing in these tests should reach a real network or log noise.
  mockFetch(() => {
    throw new Error("unexpected fetch");
  });
  mock.method(console, "error", () => {});
});

afterEach(() => {
  globalThis.fetch = realFetch;
  mock.restoreAll();
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

describe("real secret", () => {
  test("success with matching action and allowlisted hostname passes", async () => {
    mockFetch(() => json({ success: true, action: "request-access", hostname: "app.example.test" }));
    assert.equal(await verifyTurnstile("tok", "203.0.113.9", "request-access"), true);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://challenges.cloudflare.com/turnstile/v0/siteverify");
    assert.equal(calls[0].init.method, "POST");
    const body = calls[0].init.body as URLSearchParams;
    assert.equal(body.get("secret"), FAKE_SECRET);
    assert.equal(body.get("response"), "tok");
    assert.equal(body.get("remoteip"), "203.0.113.9");
  });

  test("allowlist entries are trimmed, so a second entry matches", async () => {
    mockFetch(() => json({ success: true, action: "a", hostname: "other.example.test" }));
    assert.equal(await verifyTurnstile("tok", null, "a"), true);
  });

  test("no client IP means no remoteip parameter", async () => {
    mockFetch(() => json({ success: true, action: "a", hostname: "app.example.test" }));
    await verifyTurnstile("tok", null, "a");
    assert.equal((calls[0].init.body as URLSearchParams).has("remoteip"), false);
  });

  test("success false fails", async () => {
    mockFetch(() => json({ success: false, "error-codes": ["invalid-input-response"] }));
    assert.equal(await verifyTurnstile("tok", null, "a"), false);
  });

  test("hostname not in the allowlist fails", async () => {
    mockFetch(() => json({ success: true, action: "a", hostname: "evil.example.test" }));
    assert.equal(await verifyTurnstile("tok", null, "a"), false);
  });

  test("missing hostname in the response fails", async () => {
    mockFetch(() => json({ success: true, action: "a" }));
    assert.equal(await verifyTurnstile("tok", null, "a"), false);
  });

  test("action mismatch fails", async () => {
    mockFetch(() => json({ success: true, action: "other", hostname: "app.example.test" }));
    assert.equal(await verifyTurnstile("tok", null, "a"), false);
  });

  test("success must be exactly true, not truthy", async () => {
    mockFetch(() => json({ success: "true", action: "a", hostname: "app.example.test" }));
    assert.equal(await verifyTurnstile("tok", null, "a"), false);
  });

  test("network error fails closed", async () => {
    mockFetch(() => {
      throw new Error("network down");
    });
    assert.equal(await verifyTurnstile("tok", null, "a"), false);
  });

  test("non-2xx fails closed even with a passing body", async () => {
    mockFetch(() => json({ success: true, action: "a", hostname: "app.example.test" }, 500));
    assert.equal(await verifyTurnstile("tok", null, "a"), false);
  });

  test("non-JSON body fails closed", async () => {
    mockFetch(() => new Response("<html>nope</html>", { status: 200 }));
    assert.equal(await verifyTurnstile("tok", null, "a"), false);
  });

  test("empty or unset hostname allowlist fails before any fetch", async () => {
    process.env.TURNSTILE_HOSTNAMES = " , ";
    assert.equal(await verifyTurnstile("tok", null, "a"), false);
    delete process.env.TURNSTILE_HOSTNAMES;
    assert.equal(await verifyTurnstile("tok", null, "a"), false);
    assert.equal(calls.length, 0);
  });
});

describe("token validation", () => {
  test("non-string, empty and oversized tokens fail without calling fetch", async () => {
    for (const bad of [undefined, null, 123, {}, "", "x".repeat(2049)]) {
      assert.equal(await verifyTurnstile(bad, null, "a"), false);
    }
    assert.equal(calls.length, 0);
  });

  test("a 2048 character token is accepted", async () => {
    mockFetch(() => json({ success: true, action: "a", hostname: "app.example.test" }));
    assert.equal(await verifyTurnstile("x".repeat(2048), null, "a"), true);
  });
});

describe("secret handling", () => {
  test("missing TURNSTILE_SECRET fails without calling fetch", async () => {
    delete process.env.TURNSTILE_SECRET;
    assert.equal(await verifyTurnstile("tok", null, "a"), false);
    assert.equal(calls.length, 0);
  });

  test("empty TURNSTILE_SECRET is treated as missing", async () => {
    process.env.TURNSTILE_SECRET = "";
    assert.equal(await verifyTurnstile("tok", null, "a"), false);
    assert.equal(calls.length, 0);
  });
});

describe("Cloudflare always-passes test secret", () => {
  beforeEach(() => {
    process.env.TURNSTILE_SECRET = TEST_SECRET;
  });

  test("success alone passes, with no action or hostname checks", async () => {
    mockFetch(() => json({ success: true }));
    assert.equal(await verifyTurnstile("tok", null, "request-access"), true);
  });

  test("passes even with a wrong action and a hostname outside the allowlist", async () => {
    mockFetch(() => json({ success: true, action: "wrong", hostname: "evil.example.test" }));
    assert.equal(await verifyTurnstile("tok", null, "request-access"), true);
  });

  test("passes with an empty allowlist", async () => {
    delete process.env.TURNSTILE_HOSTNAMES;
    mockFetch(() => json({ success: true }));
    assert.equal(await verifyTurnstile("tok", null, "a"), true);
  });

  test("still fails on success false, network error, non-2xx and a bad token", async () => {
    mockFetch(() => json({ success: false }));
    assert.equal(await verifyTurnstile("tok", null, "a"), false);
    mockFetch(() => {
      throw new Error("down");
    });
    assert.equal(await verifyTurnstile("tok", null, "a"), false);
    mockFetch(() => json({ success: true }, 503));
    assert.equal(await verifyTurnstile("tok", null, "a"), false);
    assert.equal(await verifyTurnstile("", null, "a"), false);
  });
});
