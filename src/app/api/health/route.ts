import { NextResponse } from "next/server";

// Unauthenticated liveness probe for uptime monitoring (Blackbox Exporter,
// etc). No auth check, no DB query - just confirms the Next.js server
// itself is up and routing requests.
export async function GET() {
  return NextResponse.json({ status: "ok" });
}
