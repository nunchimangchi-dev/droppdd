import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isSameCalendarDay } from "@/lib/streak";
import { checkIn } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  "invalid-weight": "Enter a valid positive weight.",
};

export default async function CheckInPage({
  searchParams,
}: {
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

  const progress = await prisma.progress.findFirst({ where: { userId } });
  if (!progress) {
    redirect("/onboarding");
  }

  const lastRecord = await prisma.weightRecord.findFirst({
    where: { userId },
    orderBy: { recordedAt: "desc" },
  });
  const checkedInToday = lastRecord ? isSameCalendarDay(lastRecord.recordedAt, new Date()) : false;

  const { error } = await searchParams;

  return (
    <div className="space-y-8 animate-fade-in max-w-xl mx-auto">
      <div className="relative border-l-8 border-brand-orange pl-6 md:pl-8 py-4 bg-brand-card/40 backdrop-blur-sm border-r border-y border-brand-border shadow-[20px_20px_40px_-20px_rgba(0,0,0,0.5)]">
        <h1 className="heading-mega">
          DAILY <span className="text-brand-orange">CHECK-IN</span>
        </h1>
        <p className="text-brand-text-muted text-xs font-black tracking-[0.3em] uppercase mt-2 leading-none">
          LOG TODAY&apos;S WEIGHT. KEEP THE STREAK ALIVE.
        </p>
      </div>

      {error && (
        <div className="bg-brand-danger/10 border-2 border-brand-danger text-brand-danger text-xs font-black p-4 rounded-none uppercase tracking-wider flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <span>{ERROR_MESSAGES[error] ?? "Something went wrong."}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="panel-aggressive text-center">
          <p className="label-micro mb-2">CURRENT STREAK</p>
          <p className="text-3xl font-black text-brand-orange italic">
            {progress.currentStreak} <span className="text-sm text-brand-text-muted">DAYS</span>
          </p>
        </div>
        <div className="panel-aggressive text-center">
          <p className="label-micro mb-2">CURRENT WEIGHT</p>
          <p className="text-3xl font-black text-brand-text italic">
            {progress.currentWeight} <span className="text-sm text-brand-text-muted">LBS</span>
          </p>
        </div>
      </div>

      <div className="panel-aggressive relative">
        <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-[0.02] hazard-stripes" />
        <h2 className="text-lg font-black tracking-wider text-brand-text-muted uppercase mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-brand-orange block" />
          {checkedInToday ? "UPDATE TODAY'S ENTRY" : "LOG TODAY'S WEIGHT"}
        </h2>

        {checkedInToday && (
          <p className="text-[10px] text-brand-text-muted font-bold uppercase tracking-wide mb-4">
            You already checked in today - submitting again corrects today&apos;s entry, it won&apos;t
            double-count your streak.
          </p>
        )}

        <form action={checkIn} className="space-y-5">
          <div>
            <label className="block label-micro mb-1.5">WEIGHT</label>
            <input
              type="number"
              step="0.1"
              name="weight"
              required
              defaultValue={progress.currentWeight}
              className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange hover:border-brand-border-strong rounded-none px-4 py-3 text-sm text-brand-text placeholder-brand-text-muted/40 uppercase font-bold tracking-wider focus:outline-none focus:ring-0 transition-colors"
            />
          </div>

          <div>
            <label className="block label-micro mb-1.5">UNIT</label>
            <select
              name="weightUnit"
              required
              defaultValue="LBS"
              className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange hover:border-brand-border-strong rounded-none px-3 py-3 text-sm text-brand-text uppercase font-bold tracking-wider focus:outline-none focus:ring-0 transition-colors cursor-pointer"
            >
              <option value="LBS">Pounds (lbs)</option>
              <option value="KG">Kilograms (kg)</option>
            </select>
          </div>

          <div className="pt-2">
            <button type="submit" className="btn-assault w-full">
              <span>{checkedInToday ? "UPDATE ENTRY" : "LOCK IN CHECK-IN"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
