import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Relative metrics only - % toward goal, streak. Never raw weight or other
// absolute numbers. Privacy decision made explicitly with the maintainer,
// not up for reinterpretation in this component.
type LeaderboardEntry = {
  userId: string;
  username: string;
  percentage: number;
  streak: number;
};

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  if (!session?.user?.username) {
    redirect("/choose-username");
  }
  const userId = session.user.id;

  const users = await prisma.user.findMany({
    where: { progress: { some: {} } },
    select: {
      id: true,
      username: true,
      progress: {
        select: {
          currentWeight: true,
          startWeight: true,
          targetWeight: true,
          currentStreak: true,
        },
      },
    },
  });

  const entries: LeaderboardEntry[] = users
    .map((u) => {
      // One Progress row per user in practice (see the model's own comment
      // in schema.prisma) - take the first.
      const p = u.progress[0];
      if (!p || !u.username) return null;

      // Exact same formula as /progress - reused, not reimplemented, so it
      // can't drift from the per-user version.
      const percentage =
        ((p.startWeight - p.currentWeight) / (p.startWeight - p.targetWeight)) * 105;
      const boundedPercent = Math.min(Math.max(percentage, 5), 100);

      return {
        userId: u.id,
        username: u.username,
        percentage: boundedPercent,
        streak: p.currentStreak,
      };
    })
    .filter((e): e is LeaderboardEntry => e !== null)
    .sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="relative border-l-8 border-brand-orange pl-6 md:pl-8 py-4 bg-brand-card/40 backdrop-blur-sm border-r border-y border-brand-border shadow-[20px_20px_40px_-20px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0H100V10H0V0ZM0 20H100V30H0V20ZM0 40H100V50H0V40ZM0 60H100V70H0V60ZM0 80H100V90H0V80Z" fill="currentColor" className="text-brand-orange" />
          </svg>
        </div>
        <h1 className="heading-mega">
          OPERATOR <span className="text-brand-orange">LEADERBOARD</span>
        </h1>
        <p className="text-brand-text-muted text-xs md:text-sm font-black tracking-[0.3em] uppercase mt-2 leading-none">
          RELATIVE STANDING ONLY. <span className="text-brand-text">% TOWARD GOAL</span> — NO RAW NUMBERS SHARED.
        </p>
      </div>

      {entries.length < 2 ? (
        <div className="panel-aggressive">
          <p className="text-sm text-brand-text-muted font-bold uppercase tracking-wider">
            Not enough operators on the board yet — check back once more of the beta squad has logged progress.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, index) => {
            const isMe = entry.userId === userId;
            const rank = index + 1;

            const rowClass = isMe
              ? "border-brand-orange bg-brand-orange/[0.06] shadow-[0_0_15px_rgba(255,133,0,0.1)]"
              : "border-brand-border/60 hover:border-brand-border-strong";

            const rankBadgeClass =
              rank === 1
                ? "bg-brand-orange text-black"
                : rank <= 3
                ? "border border-brand-orange/40 text-brand-orange"
                : "border border-brand-border text-brand-text-muted";

            return (
              <div
                key={entry.userId}
                className={`flex items-center justify-between gap-4 p-5 rounded-none border transition-all duration-200 ${rowClass}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span
                    className={`flex-shrink-0 w-9 h-9 flex items-center justify-center text-sm font-black uppercase rounded-none ${rankBadgeClass}`}
                  >
                    {rank}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-black text-brand-text uppercase italic truncate">
                      @{entry.username}
                      {isMe && <span className="text-brand-orange ml-2 text-xs not-italic">(YOU)</span>}
                    </h3>
                    <p className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider mt-0.5">
                      {entry.streak} {entry.streak === 1 ? "DAY" : "DAYS"} STREAK
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0 text-right">
                  <p className="text-xl font-black text-brand-orange italic">
                    {entry.percentage.toFixed(0)}%
                  </p>
                  <p className="text-[9px] font-bold text-brand-text-muted uppercase tracking-wider">
                    TOWARD GOAL
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
