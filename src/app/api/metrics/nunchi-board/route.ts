import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeGoalPercent } from "@/lib/progress-percent";

// Machine-to-machine pull for an external dashboard consumer, not a
// user-facing route. /api is excluded from proxy.ts's session-auth
// matcher (see the comment on the admin export route), so this does its
// own bearer-token check rather than relying on that exclusion alone.
// No session/cookie auth here on purpose: the caller is an unattended
// systemd timer on box, not a logged-in browser.
export async function GET(request: NextRequest) {
  const expectedToken = process.env.METRICS_EXPORT_TOKEN;
  const ownerEmail = process.env.OWNER_USER_EMAIL;

  if (!expectedToken || !ownerEmail) {
    return NextResponse.json(
      { error: "Metrics export not configured" },
      { status: 503 }
    );
  }

  const authHeader = request.headers.get("authorization");
  const presentedToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!presentedToken || presentedToken !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: ownerEmail },
    include: { progress: true },
  });

  const progress = user?.progress?.[0];
  if (!progress) {
    return NextResponse.json({ error: "No progress record" }, { status: 404 });
  }

  return NextResponse.json({
    droppddStreak: progress.currentStreak,
    // Only meaningful once mindfulnessEnabled is on for this user - reads 0
    // otherwise, same as any other user who hasn't opted in. Field name is
    // droppdd's own domain term; the NUNCHI-BOARD pull script (not this
    // route) owns the decision of what tablet-side key it lands in.
    mindfulnessStreak: progress.mindfulnessStreak,
    weightProgressPercent: computeGoalPercent(
      progress.startWeight,
      progress.currentWeight,
      progress.targetWeight
    ),
    droppddUpdatedAt: new Date().toISOString(),
  });
}
