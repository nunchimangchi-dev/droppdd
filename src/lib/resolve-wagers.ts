import { prisma } from "@/lib/prisma";
import { computeCurrentStreak } from "@/lib/checkin";
import { evaluateWager, wagerDeadline } from "@/lib/wagers";

// Resolves every ACTIVE wager this user is the measured party for: solo
// wagers they created, and peer challenges where they are the challenged
// user (a wager created for someone else resolves against THEIR progress,
// when they trigger this). Called when the user loads /wagers and whenever
// their progress changes (check-in, rest day, weight), so a win is recorded
// when it happens instead of whenever the page is next opened.
export async function resolveActiveWagersForUser(
  userId: string,
  now: Date = new Date()
): Promise<void> {
  const progress = await prisma.progress.findFirst({ where: { userId } });

  const activeWagers = await prisma.wager.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ userId, challengedUserId: null }, { challengedUserId: userId }],
    },
  });

  await Promise.all(
    activeWagers.map(async (wager) => {
      // ACTIVE always implies startValue is set (solo: at creation, peer:
      // at accept-time) - only PENDING peer challenges have a null one.
      if (wager.startValue === null) return;
      const wagerLike = { ...wager, startValue: wager.startValue };

      const deadline = wagerDeadline(wager.endDate);
      const atDeadline =
        now.getTime() >= deadline.getTime()
          ? await progressAtDeadline(userId, wagerLike, wager.startDate, deadline)
          : null;

      const resolved = evaluateWager(wagerLike, progress, now, atDeadline);
      if (resolved !== "ACTIVE") {
        await prisma.wager.update({
          where: { id: wager.id },
          data: { status: resolved, resolvedAt: now },
        });
      }
    })
  );
}

// What was true by the deadline, rebuilt from history, for wagers that were
// never resolved in time. Weight: the best weigh-in between the start and
// the deadline. Streak: the streak as of the last moment of the end date.
async function progressAtDeadline(
  userId: string,
  wager: { metric: string; startValue: number; targetValue: number },
  startDate: Date,
  deadline: Date
): Promise<{ currentWeight: number; currentStreak: number } | null> {
  const last = new Date(deadline.getTime() - 1);

  if (wager.metric === "WEIGHT_TARGET") {
    const records = await prisma.weightRecord.findMany({
      where: { userId, recordedAt: { gte: startDate, lte: last } },
      select: { weight: true },
    });
    if (records.length === 0) return null;
    const weights = records.map((r) => r.weight);
    const isLossGoal = wager.targetValue < wager.startValue;
    const best = isLossGoal ? Math.min(...weights) : Math.max(...weights);
    return { currentWeight: best, currentStreak: 0 };
  }

  if (wager.metric === "STREAK_TARGET") {
    const checkIns = await prisma.dailyCheckIn.findMany({
      where: { userId, checkInDate: { lte: last } },
    });
    return { currentWeight: 0, currentStreak: computeCurrentStreak(checkIns, last) };
  }

  return null;
}
