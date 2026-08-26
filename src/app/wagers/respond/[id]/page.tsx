import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { impliedWeeklyRatePercent, formatMetricValue } from "@/lib/wagers";
import { respondToChallenge } from "../../actions";

const ERROR_MESSAGES: Record<string, string> = {
  "too-aggressive":
    "Accepting this would imply a pace faster than we'll let you wager on — capped at ~1% bodyweight/week. You can reject it, or ask them to send a lighter target.",
  "no-progress": "Log some progress first — a wager needs a starting point to measure against.",
};

export default async function RespondToChallengePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  if (!session?.user?.termsAcceptedAt) {
    redirect("/welcome");
  }
  if (!session?.user?.username) {
    redirect("/choose-username");
  }
  const userId = session.user.id;

  const { id } = await params;
  const { error } = await searchParams;
  const wagerId = Number(id);

  const wager = await prisma.wager.findUnique({
    where: { id: wagerId },
    include: { user: { select: { username: true } } },
  });

  if (!wager || wager.challengedUserId !== userId || wager.status !== "PENDING") {
    redirect("/wagers");
  }

  const progress = await prisma.progress.findFirst({ where: { userId } });
  const currentValue = progress
    ? wager.metric === "WEIGHT_TARGET"
      ? progress.currentWeight
      : progress.currentStreak
    : null;

  const now = new Date();

  // Proactive safety preview - show the risk before they submit, not just
  // after a rejected attempt.
  let impliedRate: number | null = null;
  if (progress && currentValue !== null && wager.metric === "WEIGHT_TARGET" && wager.targetValue < currentValue) {
    impliedRate = impliedWeeklyRatePercent(currentValue, wager.targetValue, now, wager.endDate);
  }
  const wouldBeUnsafe = impliedRate !== null && impliedRate > 1;

  const daysLeft = Math.ceil((wager.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-8 animate-fade-in max-w-xl mx-auto">
      <div className="relative border-l-8 border-brand-orange pl-6 md:pl-8 py-4 bg-brand-card/40 backdrop-blur-sm border-r border-y border-brand-border shadow-[20px_20px_40px_-20px_rgba(0,0,0,0.5)]">
        <h1 className="heading-mega">
          REVIEW <span className="text-brand-orange">CHALLENGE</span>
        </h1>
        <p className="text-brand-text-muted text-xs font-black tracking-[0.3em] uppercase mt-2 leading-none">
          FROM @{wager.user.username}. READ BEFORE YOU LOCK IT IN.
        </p>
      </div>

      {error && (
        <div className="bg-brand-danger/10 border-2 border-brand-danger text-brand-danger text-xs font-black p-4 rounded-none uppercase tracking-wider flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <span>{ERROR_MESSAGES[error] ?? "Something went wrong."}</span>
        </div>
      )}

      <div className="panel-aggressive space-y-5">
        <div>
          <p className="text-[10px] font-bold text-brand-text-muted uppercase">CONTRACT</p>
          <h2 className="text-xl font-black text-brand-text uppercase italic">{wager.title}</h2>
        </div>

        {!progress ? (
          <p className="text-sm text-brand-danger font-bold uppercase tracking-wider">
            You need to log progress first (weight, streak) before you can accept this - a wager
            needs your own starting point to measure against.
          </p>
        ) : (
          <div className="bg-brand-bg/60 border border-brand-border/60 p-4 space-y-1">
            <p className="text-[10px] font-bold text-brand-text-muted uppercase">
              WHAT YOU&apos;D BE AGREEING TO:
            </p>
            <p className="text-sm font-black text-brand-text uppercase">
              {formatMetricValue(wager.metric, currentValue as number)}{" "}
              <span className="text-brand-orange font-normal">→</span>{" "}
              {formatMetricValue(wager.metric, wager.targetValue)}
            </p>
            <p className="text-[10px] text-brand-text-muted font-bold uppercase mt-2">
              Starting point is your current value at the moment you accept, not the challenger&apos;s.
            </p>
          </div>
        )}

        {wouldBeUnsafe && (
          <div className="bg-brand-warning/10 border-2 border-brand-warning text-brand-warning text-xs font-black p-4 rounded-none uppercase tracking-wider">
            ⚠️ This implies a pace faster than we allow (~1% bodyweight/week). Accepting will be
            blocked - reject it, or ask @{wager.user.username} to send a lighter target.
          </div>
        )}

        <div className="border-t border-brand-border pt-4">
          <span className="text-[9px] font-extrabold tracking-widest text-brand-text-muted block uppercase mb-1">
            STAKE AT RISK:
          </span>
          <p className="text-sm font-black text-brand-orange italic uppercase tracking-wide">
            🔥 {wager.stakeDescription}
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] font-black uppercase border-t border-brand-border pt-4">
          <span className="text-brand-text-muted">RECKONING DAY:</span>
          <span className="text-brand-text">
            {wager.endDate.toLocaleDateString()} ({daysLeft} DAYS LEFT)
          </span>
        </div>

        <div className="flex gap-3 pt-2">
          <form action={respondToChallenge} className="flex-1">
            <input type="hidden" name="wagerId" value={wager.id} />
            <input type="hidden" name="action" value="accept" />
            <button
              type="submit"
              disabled={!progress || wouldBeUnsafe}
              className="btn-assault w-full py-4 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span>CONFIRM ACCEPT</span>
            </button>
          </form>
          <form action={respondToChallenge} className="flex-1">
            <input type="hidden" name="wagerId" value={wager.id} />
            <input type="hidden" name="action" value="reject" />
            <button
              type="submit"
              className="w-full py-4 text-xs font-black uppercase tracking-wider border border-brand-danger/40 text-brand-danger hover:bg-brand-danger/10 transition-colors"
            >
              REJECT
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
