import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isPushConfigured } from "@/lib/push";

/** Constant-time string compare (hashing first makes the lengths equal). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Shared gate for the session-authenticated push routes. Returns the user
 * id, or a ready-made error response. /api is excluded from proxy.ts's
 * session redirect, so each route has to check for itself.
 */
export async function requirePushSession(
  request: NextRequest
): Promise<{ userId: string } | { error: NextResponse }> {
  if (!isPushConfigured()) {
    return { error: NextResponse.json({ error: "Push not configured" }, { status: 503 }) };
  }

  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  // CSRF: reject anything that is not same-origin with the site. A missing
  // Origin is rejected too (same-origin fetch POSTs always send one).
  let allowedOrigin: string | null = null;
  try {
    allowedOrigin = process.env.AUTH_URL ? new URL(process.env.AUTH_URL).origin : null;
  } catch {
    allowedOrigin = null;
  }
  if (!allowedOrigin || request.headers.get("origin") !== allowedOrigin) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { userId: session.user.id };
}
