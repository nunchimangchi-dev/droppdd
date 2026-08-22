import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "../../actions";

export default async function AdminUserDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/");
  }

  // Gate check
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    redirect("/");
  }

  const { id } = await props.params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      wagers: { orderBy: { createdAt: "desc" } },
      weightRecords: { orderBy: { date: "desc" } },
      progress: true,
    },
  });

  if (!user) {
    notFound();
  }

  const progress = user.progress[0] || null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Return to list button */}
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-brand-text-muted hover:text-brand-orange transition-colors uppercase"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          BACK TO OPERATOR INDEX
        </Link>
      </div>

      {/* Audit Alert Banner */}
      <div className="bg-brand-warning/15 border border-brand-warning text-brand-warning text-[10px] font-black p-4 rounded-none uppercase tracking-widest flex items-center gap-3">
        <span className="text-xl">⚠️</span>
        <span>SECURITY PROTOCOL: STRICTLY READ-ONLY AUDIT MODE. MUTATIONS DISALLOWED.</span>
      </div>

      {/* User Header */}
      <div className="panel-aggressive relative">
        <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-[0.02] hazard-stripes" />
        <span className="text-[9px] font-black tracking-widest bg-brand-orange text-black px-2 py-0.5 uppercase">
          OPERATOR SECURITY BRIEF
        </span>
        <h1 className="text-3xl font-black italic tracking-tight text-brand-text uppercase mt-4">
          {user.email ?? "ANONYMOUS OPERATOR"}
        </h1>
        <p className="text-brand-text-muted text-xs font-black uppercase mt-1">
          OPERATOR ID: {user.id} • NAME: {user.name ?? "NOT SET"}
        </p>
      </div>

      {/* Progress & Metrics Profile */}
      <div className="space-y-4">
        <h2 className="text-sm font-black tracking-widest text-brand-text-muted uppercase flex items-center gap-2">
          <span className="w-1.5 h-5 bg-brand-orange block" />
          METRIC PROFILE READOUT
        </h2>

        {!progress ? (
          <div className="p-5 bg-brand-card border border-brand-border text-brand-text-muted text-xs font-bold uppercase tracking-wider">
            No active progress records have been initialized by this operator.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-brand-card border border-brand-border p-4">
              <span className="block text-[8px] text-brand-text-muted font-extrabold uppercase tracking-widest">CURRENT STREAK</span>
              <span className="block text-xl font-black text-brand-text italic mt-1">{progress.currentStreak} DAYS</span>
            </div>
            <div className="bg-brand-card border border-brand-border p-4">
              <span className="block text-[8px] text-brand-text-muted font-extrabold uppercase tracking-widest">BEST STREAK</span>
              <span className="block text-xl font-black text-brand-text italic mt-1">{progress.bestStreak} DAYS</span>
            </div>
            <div className="bg-brand-card border border-brand-border p-4 border-l-4 border-l-brand-orange">
              <span className="block text-[8px] text-brand-text-muted font-extrabold uppercase tracking-widest">CURRENT WEIGHT</span>
              <span className="block text-xl font-black text-brand-orange italic mt-1">{progress.currentWeight} LBS</span>
            </div>
            <div className="bg-brand-card border border-brand-border p-4">
              <span className="block text-[8px] text-brand-text-muted font-extrabold uppercase tracking-widest">START WEIGHT</span>
              <span className="block text-xl font-black text-brand-text italic mt-1">{progress.startWeight} LBS</span>
            </div>
            <div className="bg-brand-card border border-brand-border p-4">
              <span className="block text-[8px] text-brand-text-muted font-extrabold uppercase tracking-widest">TARGET WEIGHT</span>
              <span className="block text-xl font-black text-brand-safe italic mt-1">{progress.targetWeight} LBS</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Wagers List - takes 2 cols */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-sm font-black tracking-widest text-brand-text-muted uppercase flex items-center gap-2">
            <span className="w-1.5 h-5 bg-brand-orange block" />
            LOCKED WAGER CONTRACTS ({user.wagers.length})
          </h2>

          {user.wagers.length === 0 ? (
            <p className="text-xs text-brand-text-muted font-bold uppercase tracking-widest bg-brand-card border border-brand-border p-5">
              No wager commitments have been signed by this user.
            </p>
          ) : (
            <div className="space-y-3">
              {user.wagers.map((w) => {
                const isWon = w.status === "WON";
                const isLost = w.status === "LOST";

                const badgeClass = isWon
                  ? "bg-brand-safe/10 text-brand-safe border-brand-safe/20"
                  : isLost
                  ? "bg-brand-danger/10 text-brand-danger border-brand-danger/20"
                  : "bg-brand-orange/10 text-brand-orange border-brand-orange/20";

                return (
                  <div
                    key={w.id}
                    className="p-5 bg-brand-card border border-brand-border flex flex-col justify-between relative"
                  >
                    <div className="absolute top-4 right-4 text-[8px] font-extrabold tracking-widest uppercase text-brand-text-muted">
                      ID: #{w.id}
                    </div>

                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className={`text-[8px] font-black tracking-widest px-2 py-0.5 rounded-none uppercase border ${badgeClass}`}>
                          {w.status}
                        </span>
                        <h3 className="text-lg font-black italic tracking-tight text-brand-text uppercase mt-3">
                          {w.title}
                        </h3>
                        <p className="text-[10px] text-brand-text-muted font-bold uppercase mt-1 tracking-wider">
                          METRIC: {w.metric.replace("_", " ")} • END DATE: {new Date(w.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 bg-brand-bg border border-brand-border p-3 space-y-1">
                      <p className="text-[8px] font-extrabold text-brand-text-muted uppercase">CONTRACT SPECIFICATIONS:</p>
                      <p className="text-xs font-black text-brand-text uppercase">
                        RANGE: {w.startValue} <span className="text-brand-orange">→</span> {w.targetValue}
                      </p>
                      <p className="text-xs font-black text-brand-orange italic uppercase">
                        STAKE: {w.stakeDescription}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Weight Record list */}
        <div className="space-y-4">
          <h2 className="text-sm font-black tracking-widest text-brand-text-muted uppercase flex items-center gap-2">
            <span className="w-1.5 h-5 bg-brand-orange block" />
            WEIGH-IN LOGS ({user.weightRecords.length})
          </h2>

          {user.weightRecords.length === 0 ? (
            <p className="text-xs text-brand-text-muted font-bold uppercase tracking-widest bg-brand-card border border-brand-border p-5">
              No historical weigh-ins logged.
            </p>
          ) : (
            <div className="bg-brand-card border border-brand-border divide-y divide-brand-border max-h-[480px] overflow-y-auto">
              {user.weightRecords.map((rec) => (
                <div key={rec.id} className="p-3 flex justify-between items-center text-xs font-bold uppercase">
                  <span className="text-brand-text-muted tracking-wider">{new Date(rec.date).toLocaleDateString()}</span>
                  <span className="text-brand-text font-black text-sm italic">{rec.weight} LBS</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
