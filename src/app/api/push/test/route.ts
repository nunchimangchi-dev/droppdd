import { NextRequest, NextResponse } from "next/server";
import { sendToUser } from "@/lib/push";
import { requirePushSession } from "@/lib/push-api";

// One test notification per user per minute. In-memory, so it resets on
// restart and is per process, which is fine for a single-host deploy.
const RATE_WINDOW_MS = 60_000;
const lastTestAt = new Map<string, number>();

export async function POST(request: NextRequest) {
  const gate = await requirePushSession(request);
  if ("error" in gate) return gate.error;

  const now = Date.now();
  const last = lastTestAt.get(gate.userId);
  if (last !== undefined && now - last < RATE_WINDOW_MS) {
    const retryAfter = Math.ceil((RATE_WINDOW_MS - (now - last)) / 1000);
    return NextResponse.json(
      { error: "Try again in a minute" },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }
  lastTestAt.set(gate.userId, now);
  // Drop stale entries so the map cannot grow without bound.
  for (const [id, at] of lastTestAt) {
    if (now - at >= RATE_WINDOW_MS) lastTestAt.delete(id);
  }

  const result = await sendToUser(gate.userId, {
    title: "DROPPDD",
    body: "Test notification. Notifications are working.",
    url: "/profile",
  });

  return NextResponse.json({ ok: result.sent > 0, sent: result.sent });
}
