import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isSameCalendarDay } from "@/lib/streak";
import {
  STRENGTH_EXERCISES,
  STRENGTH_THRESHOLD,
  REST_DAY_INTERVAL_DAYS,
  countStrengthCompleted,
  isRestDayEligible,
} from "@/lib/checkin";
import { checkIn, takeRestDay } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  "invalid-entry": "Something on that submission didn't look right - try again.",
  "rest-day-not-eligible": `Rest Day is a once-every-${REST_DAY_INTERVAL_DAYS}-days pass - not available yet.`,
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

  const now = new Date();

  const mostRecent = await prisma.dailyCheckIn.findFirst({
    where: { userId },
    orderBy: { checkInDate: "desc" },
  });
  const todayCheckIn = mostRecent && isSameCalendarDay(mostRecent.checkInDate, now) ? mostRecent : null;

  const lastRestDay = await prisma.dailyCheckIn.findFirst({
    where: { userId, restDay: true },
    orderBy: { checkInDate: "desc" },
  });
  const restDayEligible = isRestDayEligible(lastRestDay?.checkInDate ?? null, now) && !todayCheckIn?.restDay;

  const { error } = await searchParams;

  const strengthCompleted = todayCheckIn ? countStrengthCompleted(todayCheckIn) : 0;

  return (
    <div className="space-y-8 animate-fade-in max-w-xl mx-auto">
      <div className="relative border-l-8 border-brand-orange pl-6 md:pl-8 py-4 bg-brand-card/40 backdrop-blur-sm border-r border-y border-brand-border shadow-[20px_20px_40px_-20px_rgba(0,0,0,0.5)]">
        <h1 className="heading-mega">
          DAILY <span className="text-brand-orange">CHECK-IN</span>
        </h1>
        <p className="text-brand-text-muted text-xs font-black tracking-[0.3em] uppercase mt-2 leading-none">
          THREE GREEN CHECKS KEEP THE STREAK ALIVE.
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

      {todayCheckIn?.restDay ? (
        <div className="panel-aggressive border-brand-safe/50 text-center space-y-2">
          <span className="text-3xl">✅</span>
          <p className="text-sm font-black text-brand-safe uppercase tracking-wide">
            REST DAY LOCKED IN FOR TODAY
          </p>
          <p className="text-[10px] text-brand-text-muted uppercase font-bold">
            Next one opens up in {REST_DAY_INTERVAL_DAYS} days.
          </p>
        </div>
      ) : (
        <form action={checkIn} className="panel-aggressive relative space-y-8">
          <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-[0.02] hazard-stripes" />

          {/* Strength */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black tracking-wider text-brand-text-muted uppercase flex items-center gap-2">
                <span className="w-1.5 h-5 bg-brand-orange block" />
                STRENGTH
              </h2>
              <span
                className={`text-[10px] font-black uppercase px-2 py-1 border ${
                  strengthCompleted >= STRENGTH_THRESHOLD
                    ? "bg-brand-safe/10 text-brand-safe border-brand-safe/30"
                    : "bg-brand-bg text-brand-text-muted border-brand-border"
                }`}
              >
                {strengthCompleted} / {STRENGTH_EXERCISES.length} &middot; NEED {STRENGTH_THRESHOLD}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STRENGTH_EXERCISES.map((ex) => (
                <label
                  key={ex.field}
                  className="flex items-center gap-3 bg-brand-bg/50 border border-brand-border p-3 cursor-pointer hover:border-brand-border-strong"
                >
                  <input
                    type="checkbox"
                    name={ex.field}
                    defaultChecked={todayCheckIn ? Boolean(todayCheckIn[ex.field]) : false}
                    className="w-4 h-4 bg-brand-bg border border-brand-border accent-brand-orange cursor-pointer flex-shrink-0"
                  />
                  <span className="text-xs font-bold text-brand-text uppercase">
                    {ex.label}
                    <span className="block text-[9px] text-brand-text-muted font-black tracking-wide">
                      {ex.sets} × {ex.reps}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Movement */}
          <div className="space-y-3">
            <h2 className="text-sm font-black tracking-wider text-brand-text-muted uppercase flex items-center gap-2">
              <span className="w-1.5 h-5 bg-brand-orange block" />
              MOVEMENT
            </h2>
            <label className="flex items-center gap-3 bg-brand-bg/50 border border-brand-border p-4 cursor-pointer hover:border-brand-border-strong">
              <input
                type="checkbox"
                name="movementMet"
                defaultChecked={todayCheckIn?.movementMet ?? false}
                className="w-5 h-5 bg-brand-bg border border-brand-border accent-brand-orange cursor-pointer flex-shrink-0"
              />
              <span className="text-xs font-bold text-brand-text uppercase">
                10,000+ steps today (walking, running, swimming, biking - whatever gets you moving counts)
              </span>
            </label>
          </div>

          {/* Eating */}
          <div className="space-y-3">
            <h2 className="text-sm font-black tracking-wider text-brand-text-muted uppercase flex items-center gap-2">
              <span className="w-1.5 h-5 bg-brand-orange block" />
              EATING
            </h2>
            <label className="flex items-center gap-3 bg-brand-bg/50 border border-brand-border p-4 cursor-pointer hover:border-brand-border-strong">
              <input
                type="checkbox"
                name="eatingMet"
                defaultChecked={todayCheckIn?.eatingMet ?? false}
                className="w-5 h-5 bg-brand-bg border border-brand-border accent-brand-orange cursor-pointer flex-shrink-0"
              />
              <span className="text-xs font-bold text-brand-text uppercase">
                Ate within my OMAD window today
              </span>
            </label>
          </div>

          {/* Weight - optional */}
          <div className="space-y-3 border-t-2 border-dashed border-brand-border pt-6">
            <h2 className="text-sm font-black tracking-wider text-brand-text-muted uppercase flex items-center gap-2">
              <span className="w-1.5 h-5 bg-brand-border block" />
              WEIGHT <span className="text-brand-text-muted/60 normal-case font-bold">(optional)</span>
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="0.1"
                name="weight"
                placeholder={String(progress.currentWeight)}
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange rounded-none px-4 py-3 text-sm text-brand-text placeholder-brand-text-muted/40 uppercase font-bold tracking-wider focus:outline-none focus:ring-0"
              />
              <select
                name="weightUnit"
                defaultValue="LBS"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange rounded-none px-3 py-3 text-sm text-brand-text uppercase font-bold tracking-wider focus:outline-none focus:ring-0 cursor-pointer"
              >
                <option value="LBS">Pounds (lbs)</option>
                <option value="KG">Kilograms (kg)</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-assault w-full">
            <span>{todayCheckIn ? "UPDATE TODAY'S CHECK-IN" : "LOCK IN CHECK-IN"}</span>
          </button>
        </form>
      )}

      {/* Rest Day */}
      {!todayCheckIn?.restDay && (
        <div className="panel-aggressive border-brand-border/60 text-center space-y-3">
          <p className="text-xs font-black text-brand-text-muted uppercase tracking-wide">
            Not feeling it today?
          </p>
          {restDayEligible ? (
            <form action={takeRestDay}>
              <button
                type="submit"
                className="text-[10px] font-black tracking-[0.15em] uppercase px-4 py-3 bg-transparent text-brand-orange border border-brand-orange/30 hover:bg-brand-orange hover:text-black transition-colors cursor-pointer"
              >
                TAKE A REST DAY
              </button>
              <p className="text-[9px] text-brand-text-muted mt-2 uppercase font-bold">
                One floating pass every {REST_DAY_INTERVAL_DAYS} days - still keeps your streak.
              </p>
            </form>
          ) : (
            <p className="text-[10px] text-brand-text-muted uppercase font-bold tracking-wide">
              Rest Day already used recently - back in rotation every {REST_DAY_INTERVAL_DAYS} days.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
