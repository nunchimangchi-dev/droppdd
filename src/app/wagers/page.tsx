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
      <div className="border-l-4 border-orange-500 pl-4 md:pl-6 py-2">
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-zinc-900 dark:text-zinc-50">
          WAGERS
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-black tracking-widest uppercase mt-1">
          PUT YOUR MONEY WHERE YOUR MOUTH IS. HONOR SYSTEM, NO REAL STAKES YET.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold p-4 rounded-sm">
          {ERROR_MESSAGES[error] ?? "Something went wrong."}
        </div>
      )}

      {/* Creation form */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-sm">
        <h2 className="text-lg font-black tracking-wider text-zinc-400 uppercase mb-6">
          NEW WAGER
        </h2>

        {!progress ? (
          <p className="text-sm text-zinc-500">
            No progress data yet — log a weigh-in first before creating a wager.
          </p>
        ) : (
          <form action={createWager} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-1">
                Title
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. Under 185 by October"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-1">
                  Metric
                </label>
                <select
                  name="metric"
                  required
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm px-3 py-2 text-sm"
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
                <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-1">
                  Target value
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="targetValue"
                  required
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-1">
                Stake (honor system)
              </label>
              <input
                type="text"
                name="stakeDescription"
                required
                placeholder="e.g. $20 to Feeding America if I miss this"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500 mb-1">
                End date
              </label>
              <input
                type="date"
                name="endDate"
                required
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-sm px-3 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-black font-black text-xs tracking-widest px-5 py-3 transition-all duration-150 uppercase"
            >
              LOCK IT IN
            </button>
          </form>
        )}
      </div>

      {/* Active wagers */}
      <div>
        <h2 className="text-lg font-black tracking-wider text-zinc-400 uppercase mb-4">
          ACTIVE ({active.length})
        </h2>
        {active.length === 0 ? (
          <p className="text-sm text-zinc-500">No active wagers.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {active.map((w) => (
              <div
                key={w.id}
                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-5 rounded-sm"
              >
                <p className="text-[10px] font-black tracking-widest uppercase text-orange-500">
                  {w.metric.replace("_", " ")}
                </p>
                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50 mt-1">
                  {w.title}
                </h3>
                <p className="text-xs text-zinc-500 mt-2">
                  {w.startValue} → {w.targetValue}, by{" "}
                  {w.endDate.toLocaleDateString()}
                </p>
                <p className="text-xs text-zinc-400 mt-2 italic">{w.stakeDescription}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <h2 className="text-lg font-black tracking-wider text-zinc-400 uppercase mb-4">
            HISTORY
          </h2>
          <div className="space-y-2">
            {history.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-4 rounded-sm"
              >
                <div>
                  <p className="text-sm font-black text-zinc-900 dark:text-zinc-50">{w.title}</p>
                  <p className="text-xs text-zinc-500">{w.stakeDescription}</p>
                </div>
                <span
                  className={`text-[10px] font-black tracking-widest uppercase px-2 py-1 rounded-sm ${
                    w.status === "WON"
                      ? "bg-green-500/10 text-green-500 border border-green-500/20"
                      : "bg-red-500/10 text-red-500 border border-red-500/20"
                  }`}
                >
                  {w.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
