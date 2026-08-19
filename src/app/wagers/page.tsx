import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { evaluateWager, impliedWeeklyRatePercent } from "@/lib/wagers";

const ERROR_MESSAGES: Record<string, string> = {
  "no-progress": "Log some progress first — a wager needs a starting point to measure against.",
  "missing-fields": "Every field is required.",
  "invalid-date": "End date has to be in the future.",
  "too-aggressive":
    "That pace is faster than we'll let you wager on — capped at ~1% bodyweight/week. Pick a lighter target or a longer end date.",
};

export default async function WagersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  const userId = session.user.id;
  const { error } = await searchParams;

  const progress = await prisma.progress.findFirst({ where: { userId } });

  const activeWagers = await prisma.wager.findMany({
    where: { userId, status: "ACTIVE" },
  });

  const now = new Date();
  await Promise.all(
    activeWagers.map(async (wager) => {
      const resolved = evaluateWager(wager, progress, now);
      if (resolved !== "ACTIVE") {
        await prisma.wager.update({
          where: { id: wager.id },
          data: { status: resolved, resolvedAt: now },
        });
      }
    })
  );

  const wagers = await prisma.wager.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  const active = wagers.filter((w) => w.status === "ACTIVE");
  const history = wagers.filter((w) => w.status !== "ACTIVE");

  async function createWager(formData: FormData) {
    "use server";

    const session = await auth();
    if (!session?.user?.id) redirect("/signin");
    const userId = session.user.id;

    const title = formData.get("title")?.toString().trim();
    const metric = formData.get("metric")?.toString();
    const targetValueRaw = formData.get("targetValue")?.toString();
    const stakeDescription = formData.get("stakeDescription")?.toString().trim();
    const endDateRaw = formData.get("endDate")?.toString();

    if (!title || !metric || !targetValueRaw || !stakeDescription || !endDateRaw) {
      redirect("/wagers?error=missing-fields");
    }

    const targetValue = Number(targetValueRaw);
    const endDate = new Date(endDateRaw);
    const now = new Date();

    if (Number.isNaN(endDate.getTime()) || endDate <= now) {
      redirect("/wagers?error=invalid-date");
    }

    const progress = await prisma.progress.findFirst({ where: { userId } });
    if (!progress) {
      redirect("/wagers?error=no-progress");
    }

    const startValue =
      metric === "WEIGHT_TARGET" ? progress.currentWeight : progress.currentStreak;

    if (metric === "WEIGHT_TARGET" && targetValue < startValue) {
      const rate = impliedWeeklyRatePercent(startValue, targetValue, now, endDate);
      if (rate > 1) {
        redirect("/wagers?error=too-aggressive");
      }
    }

    await prisma.wager.create({
      data: {
        userId,
        title,
        metric,
        startValue,
        targetValue,
        stakeDescription,
        endDate,
      },
    });

    redirect("/wagers");
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Aggressive Section Header */}
      <div className="relative border-l-8 border-brand-orange pl-6 md:pl-8 py-4 bg-brand-card/40 backdrop-blur-sm border-r border-y border-brand-border shadow-[20px_20px_40px_-20px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0H100V10H0V0ZM0 20H100V30H0V20ZM0 40H100V50H0V40ZM0 60H100V70H0V60ZM0 80H100V90H0V80Z" fill="currentColor" className="text-brand-orange" />
          </svg>
        </div>
        <h1 className="heading-mega">
          STAKES <span className="text-brand-orange">&</span> WAGERS
        </h1>
        <p className="text-brand-text-muted text-xs md:text-sm font-black tracking-[0.3em] uppercase mt-2 leading-none">
          PUT YOUR MONEY WHERE YOUR MOUTH IS. <span className="text-brand-text">HONOR SYSTEM</span> — FAILURE HAS CONSEQUENCES.
        </p>
      </div>

      {error && (
        <div className="bg-brand-danger/10 border-2 border-brand-danger text-brand-danger text-xs font-black p-4 rounded-none uppercase tracking-wider flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <span>{ERROR_MESSAGES[error] ?? "Something went wrong."}</span>
        </div>
      )}

      {/* Creation form */}
      <div className="panel-aggressive relative">
        <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-[0.02] hazard-stripes" />
        <h2 className="text-lg font-black tracking-wider text-brand-text-muted uppercase mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-brand-orange block" />
          CONTRACT INITIALIZATION
        </h2>

        {!progress ? (
          <p className="text-sm text-brand-text-muted font-bold uppercase tracking-wider">
            No progress data yet — log a weigh-in first before creating a wager.
          </p>
        ) : (
          <form action={createWager} className="space-y-5">
            <div>
              <label className="block label-micro mb-1.5">
                CONTRACT TITLE / GOAL DESIGNATOR
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. Under 185 by October"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange hover:border-brand-border-strong rounded-none px-4 py-3 text-sm text-brand-text placeholder-brand-text-muted/40 uppercase font-bold tracking-wider focus:outline-none focus:ring-0 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block label-micro mb-1.5">
                  TARGET METRIC
                </label>
                <select
                  name="metric"
                  required
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange hover:border-brand-border-strong rounded-none px-4 py-3 text-sm text-brand-text uppercase font-bold tracking-wider focus:outline-none focus:ring-0 transition-colors cursor-pointer"
                >
                  <option value="WEIGHT_TARGET">
                    Weight target (currently {progress.currentWeight} lbs)
                  </option>
                  <option value="STREAK_TARGET">
                    Streak target (currently {progress.currentStreak} days)
                  </option>
                </select>
              </div>

              <div>
                <label className="block label-micro mb-1.5">
                  TARGET ABSOLUTE VALUE
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="targetValue"
                  required
                  placeholder="e.g. 180"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange hover:border-brand-border-strong rounded-none px-4 py-3 text-sm text-brand-text placeholder-brand-text-muted/40 uppercase font-bold tracking-wider focus:outline-none focus:ring-0 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block label-micro mb-1.5">
                STAKE / INDENTURE (HONOR SYSTEM)
              </label>
              <input
                type="text"
                name="stakeDescription"
                required
                placeholder="e.g. $20 to Feeding America if I miss this"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange hover:border-brand-border-strong rounded-none px-4 py-3 text-sm text-brand-text placeholder-brand-text-muted/40 uppercase font-bold tracking-wider focus:outline-none focus:ring-0 transition-colors"
              />
            </div>

            <div>
              <label className="block label-micro mb-1.5">
                END DATE / RECKONING DAY
              </label>
              <input
                type="date"
                name="endDate"
                required
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange hover:border-brand-border-strong rounded-none px-4 py-3 text-sm text-brand-text uppercase font-bold tracking-wider focus:outline-none focus:ring-0 transition-colors cursor-pointer"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="btn-assault w-full md:w-auto"
              >
                <span>LOCK IN COMMITMENT</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Active wagers */}
      <div className="space-y-4">
        <h2 className="text-lg font-black tracking-wider text-brand-text-muted uppercase mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-brand-orange block" />
          ACTIVE CONTRACTS ({active.length})
        </h2>
        {active.length === 0 ? (
          <p className="text-sm text-brand-text-muted font-bold uppercase tracking-wider">No active commitments locked in.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {active.map((w) => {
              // Determine days remaining to exp
              const daysLeft = Math.ceil((w.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const isUrgent = daysLeft <= 7;
              const isCritical = daysLeft <= 2;
              
              const borderClass = isCritical 
                ? "border-brand-danger shadow-[0_0_15px_rgba(255,51,51,0.15)]" 
                : isUrgent 
                ? "border-brand-warning shadow-[0_0_15px_rgba(255,184,0,0.1)]" 
                : "border-brand-orange/40 hover:border-brand-orange";

              const badgeColor = isCritical 
                ? "bg-brand-danger text-black" 
                : isUrgent 
                ? "bg-brand-warning text-black" 
                : "bg-brand-orange text-black";

              const urgencyLabel = isCritical
                ? "CRITICAL LIMIT"
                : isUrgent
                ? "WARNING LIMIT"
                : "ACTIVE STAKE";

              return (
                <div
                  key={w.id}
                  className={`bg-brand-card border p-6 rounded-none relative overflow-hidden flex flex-col justify-between transition-all duration-300 ${borderClass}`}
                >
                  {/* Subtle backing hazard striping */}
                  <div className="absolute inset-0 pointer-events-none opacity-[0.04] hazard-stripes" />
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start gap-4">
                      <span className={`text-[9px] font-black tracking-widest px-2.5 py-0.5 rounded-none uppercase leading-none ${badgeColor}`}>
                        {urgencyLabel}
                      </span>
                      <span className="text-[10px] font-extrabold tracking-widest text-brand-text-muted uppercase leading-none">
                        {w.metric.replace("_", " ")}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-brand-text mt-4 uppercase italic tracking-tight">
                      {w.title}
                    </h3>
                    
                    <div className="mt-4 bg-brand-bg/60 border border-brand-border/60 p-4 space-y-1">
                      <p className="text-[10px] font-bold text-brand-text-muted uppercase">STRIKING RANGE:</p>
                      <p className="text-sm font-black text-brand-text uppercase">
                        {w.startValue} <span className="text-brand-orange font-normal">→</span> {w.targetValue}
                      </p>
                    </div>

                    <div className="mt-4 border-t border-brand-border/60 pt-4">
                      <span className="text-[9px] font-extrabold tracking-widest text-brand-text-muted block uppercase mb-1">
                        STAKE AT RISK:
                      </span>
                      <p className="text-sm font-black text-brand-orange italic uppercase tracking-wide flex items-center gap-1.5">
                        <span className="animate-pulse">🔥</span> {w.stakeDescription}
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 mt-6 pt-4 border-t border-brand-border/60 flex items-center justify-between text-[11px] font-black uppercase">
                    <span className="text-brand-text-muted">EXPIRATION DATE:</span>
                    <span className={isUrgent ? (isCritical ? "text-brand-danger" : "text-brand-warning") : "text-brand-text"}>
                      {w.endDate.toLocaleDateString()} ({daysLeft} DAYS LEFT)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-black tracking-wider text-brand-text-muted uppercase mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-brand-orange block" />
            RESOLVED CONTRACTS
          </h2>
          <div className="space-y-3">
            {history.map((w) => {
              const isWon = w.status === "WON";
              const statusColorClass = isWon
                ? "border-brand-safe/20 hover:border-brand-safe/50 bg-brand-safe/[0.02]"
                : "border-brand-danger/20 hover:border-brand-danger/50 bg-brand-danger/[0.02]";

              const badgeColorClass = isWon
                ? "bg-brand-safe/10 text-brand-safe border border-brand-safe/20"
                : "bg-brand-danger/10 text-brand-danger border border-brand-danger/20";

              return (
                <div
                  key={w.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-none border transition-all duration-200 ${statusColorClass}`}
                >
                  <div className="space-y-1 mb-3 sm:mb-0">
                    <span className="text-[9px] font-extrabold tracking-widest text-brand-text-muted block uppercase">
                      {w.metric.replace("_", " ")}
                    </span>
                    <h4 className="text-base font-black text-brand-text uppercase italic">
                      {w.title}
                    </h4>
                    <p className="text-xs text-brand-text-muted font-bold uppercase tracking-wide italic">
                      STAKE: <span className="text-brand-text/80">{w.stakeDescription}</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-6 justify-between sm:justify-start">
                    <div className="text-left sm:text-right">
                      <p className="text-[9px] font-extrabold tracking-widest text-brand-text-muted uppercase mb-0.5">TARGET RANGE</p>
                      <p className="text-xs font-black text-brand-text uppercase">
                        {w.startValue} <span className="text-brand-text-muted">→</span> {w.targetValue}
                      </p>
                    </div>
                    
                    <span className={`text-[10px] font-black tracking-[0.2em] uppercase px-4 py-2 rounded-none leading-none ${badgeColorClass}`}>
                      {w.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
