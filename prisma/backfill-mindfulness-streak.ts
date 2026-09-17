// One-off backfill: the owner (OWNER_USER_EMAIL) attests to 35 real,
// consecutive calendar days of an actual mindfulness practice that predate
// droppdd's Mindfulness feature - this records that real history as real
// DailyCheckIn rows (mindfulnessMet: true) rather than hand-setting a
// streak number with no data behind it. Everything else on any touched row
// is left exactly as it was; days with no existing row get a new one with
// only mindfulnessMet set (strength/movement/eating/restDay stay at their
// schema defaults - this script makes no claim about those habits on those
// days). Idempotent: safe to re-run, upserts by day rather than blindly
// inserting.
//
// Run with: npx tsx prisma/backfill-mindfulness-streak.ts
import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { computeMindfulnessStreak } from "../src/lib/checkin";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

const BACKFILL_DAYS = 35;

function dayRangeUtc(date: Date): { start: Date; end: Date } {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

async function main() {
  const ownerEmail = process.env.OWNER_USER_EMAIL;
  if (!ownerEmail) {
    throw new Error("OWNER_USER_EMAIL not set - refusing to guess which account to backfill");
  }

  const user = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (!user) throw new Error(`No user found for OWNER_USER_EMAIL=${ownerEmail}`);

  const progress = await prisma.progress.findFirst({ where: { userId: user.id } });
  if (!progress) throw new Error(`No Progress record for user ${user.id}`);

  const today = new Date();
  const dates: Date[] = [];
  for (let i = BACKFILL_DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    dates.push(d);
  }

  for (const date of dates) {
    const { start, end } = dayRangeUtc(date);
    const existing = await prisma.dailyCheckIn.findFirst({
      where: { userId: user.id, checkInDate: { gte: start, lt: end } },
    });

    if (existing) {
      if (!existing.mindfulnessMet) {
        await prisma.dailyCheckIn.update({
          where: { id: existing.id },
          data: { mindfulnessMet: true },
        });
        console.log(`Updated ${start.toISOString().slice(0, 10)}: mindfulnessMet -> true`);
      } else {
        console.log(`${start.toISOString().slice(0, 10)}: already true, skipped`);
      }
    } else {
      const checkInDate = new Date(start);
      checkInDate.setUTCHours(12, 0, 0, 0); // noon UTC - clear of either day boundary
      await prisma.dailyCheckIn.create({
        data: { userId: user.id, checkInDate, mindfulnessMet: true },
      });
      console.log(`Created ${start.toISOString().slice(0, 10)}: mindfulnessMet = true (new row)`);
    }
  }

  const allCheckIns = await prisma.dailyCheckIn.findMany({ where: { userId: user.id } });
  const newMindfulnessStreak = computeMindfulnessStreak(allCheckIns);
  await prisma.progress.update({
    where: { id: progress.id },
    data: { mindfulnessStreak: newMindfulnessStreak, mindfulnessEnabled: true },
  });

  console.log(`Done. Progress.mindfulnessStreak = ${newMindfulnessStreak}, mindfulnessEnabled = true`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
