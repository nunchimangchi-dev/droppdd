// Cloudflare Turnstile — server-side verification for the public
// /request-access form. The widget is "managed" mode, no pre-clearance.
//
// Env:
//   TURNSTILE_SECRET     - the widget secret key (required in every real env)
//   TURNSTILE_HOSTNAMES   - comma-separated allowlist of frontend hostnames
//                           siteverify may report. Per-environment:
//                             local   -> localhost
//                             staging -> droppdd-staging.tail2b3f17.ts.net
//                             prod    -> droppdd.alwaysgivealwaysget.com
//   NEXT_PUBLIC_TURNSTILE_SITEKEY - optional override (local uses the
//                           always-passes test sitekey). Defaults to the
//                           real widget's public sitekey.

export const TURNSTILE_SITEKEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY ?? "0x4AAAAAAEmAkbs-A5qk2TsS";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Cloudflare's documented "always passes" test secret. When it's in use
// (local dev only — a real env never carries it) require only
// success === true: test tokens carry no action and the response reports
// no predictable hostname, so those two checks are skipped for the test
// secret and fully enforced everywhere real.
const TEST_SECRET = "1x0000000000000000000000000000000AA";

function expectedHostnames(): Set<string> {
  return new Set(
    (process.env.TURNSTILE_HOSTNAMES ?? "")
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean),
  );
}

interface SiteverifyResult {
  success?: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
}

/**
 * Canonical server-side Turnstile check. Fails closed on any error,
 * network fault, non-2xx, or non-JSON body. Requires:
 *   - success === true
 *   - action === expectedAction
 *   - hostname in the per-environment allowlist (unless the test secret)
 */
export async function verifyTurnstile(
  token: unknown,
  clientIp: string | null,
  expectedAction: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) {
    console.error("verifyTurnstile: TURNSTILE_SECRET missing from server environment.");
    return false;
  }

  const hostnames = expectedHostnames();
  const isTestSecret = secret === TEST_SECRET;

  if (
    typeof token !== "string" ||
    token.length === 0 ||
    token.length > 2048 ||
    (!isTestSecret && hostnames.size === 0)
  ) {
    return false;
  }

  let result: SiteverifyResult;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (clientIp) body.set("remoteip", clientIp);
    const r = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) throw new Error(`siteverify HTTP ${r.status}`);
    result = (await r.json()) as SiteverifyResult;
  } catch (err) {
    console.error("verifyTurnstile: siteverify call failed:", err);
    return false;
  }

  if (result.success !== true) {
    return false;
  }
  if (isTestSecret) {
    return true;
  }
  return (
    result.action === expectedAction &&
    typeof result.hostname === "string" &&
    hostnames.has(result.hostname)
  );
}
