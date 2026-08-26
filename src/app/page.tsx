import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { dayOfYearOffset } from "@/lib/daily-rotation";

export default async function Dashboard() {
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

  // Rotates daily instead of always showing the same fixed catalog row -
  // same pick for every user on a given day, deterministic, no new
  // schema/tracking needed.
  const workoutCount = await prisma.workout.count();
  const mealCount = await prisma.meal.count();
  const wod = await prisma.workout.findFirst({
    orderBy: { id: "asc" },
    skip: dayOfYearOffset(workoutCount),
    include: { exercises: true },
  });
  const nextMeal = await prisma.meal.findFirst({
    orderBy: { id: "asc" },
    skip: dayOfYearOffset(mealCount),
  });
  const progress = await prisma.progress.findFirst({
    where: { userId },
  });

  if (!progress) {
    redirect("/onboarding");
  }

  if (!wod || !nextMeal) {
    return <div className="text-brand-text font-black text-center py-16 uppercase">Data not found</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Aggressive Hero Header */}
      <div className="relative border-l-8 border-brand-orange pl-6 md:pl-8 py-4 bg-brand-card/40 backdrop-blur-sm border-r border-y border-brand-border shadow-[20px_20px_40px_-20px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0H100V10H0V0ZM0 20H100V30H0V20ZM0 40H100V50H0V40ZM0 60H100V70H0V60ZM0 80H100V90H0V80Z" fill="currentColor" className="text-brand-orange" />
          </svg>
        </div>
        <h1 className="heading-mega">
          DAILY <span className="text-brand-orange">ASSAULT</span>
        </h1>
        <p className="text-brand-text-muted text-xs md:text-sm font-black tracking-[0.3em] uppercase mt-2 leading-none">
          TODAY IS A GOOD DAY TO <span className="text-brand-text">SUFFER</span>. NO REASONABLE EXCUSES.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* FASTING STATUS / OMAD - honest placeholder, real per-user fasting-window
            tracking isn't built yet (would need a meal-timing log, not just a
            static number) - don't present fake data as a live countdown. */}
        <div className="panel-aggressive flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] tracking-[0.2em] font-extrabold text-brand-orange uppercase leading-none">
                FASTING WINDOW (OMAD)
              </span>
              <span className="text-[9px] font-black bg-brand-border/40 text-brand-text-muted px-2 py-0.5 rounded-none border border-brand-border uppercase leading-none">
                NOT TRACKED YET
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight mt-4 text-brand-text-muted italic uppercase">
              COMING SOON
            </h2>
            <p className="text-[10px] text-brand-text-muted font-extrabold uppercase mt-1">
              REAL-TIME FASTING TRACKING ISN&apos;T BUILT YET
            </p>
          </div>

          <div className="mt-6 border-t border-brand-border pt-4">
            <p className="text-[9px] text-brand-text-muted font-bold uppercase tracking-wider">
              Log your meals manually via the Nutrition System for now.
            </p>
          </div>
        </div>

        {/* STREAK */}
        <div className="panel-aggressive flex flex-col justify-between">
          <div>
            <span className="label-micro">
              CONSISTENCY INDEX
            </span>
            <div className="flex items-baseline gap-2 mt-4">
              <h2 className="text-5xl font-black tracking-tight text-brand-text italic leading-none">
                {progress.currentStreak}
              </h2>
              <span className="text-lg font-black text-brand-orange italic">DAYS</span>
            </div>
            <p className="text-[10px] text-brand-text-muted font-extrabold uppercase mt-1">
              {progress.currentStreak > 0 ? "STREAK 🔥 ACTIVE & STRONG" : "DAY ONE. LET'S GO."}
            </p>
          </div>

          <div className="border-t border-brand-border pt-4 mt-6 flex justify-between items-center text-xs">
            <span className="font-extrabold text-brand-text-muted uppercase">ALL-TIME RECORD:</span>
            <span className="font-black text-brand-text">{progress.bestStreak} DAYS</span>
          </div>
        </div>

        {/* WEIGHT PROGRESS */}
        <div className="panel-aggressive flex flex-col justify-between">
          <div>
            <span className="label-micro">
              BODY WEIGHT TREND
            </span>
            <div className="flex items-baseline gap-1 mt-4">
              <h2 className="text-5xl font-black tracking-tight text-brand-text italic leading-none">
                {progress.currentWeight}
              </h2>
              <span className="text-sm font-black text-brand-text-muted italic">LBS</span>
            </div>
            <p className="text-[10px] text-brand-safe font-extrabold uppercase mt-1">
              {progress.startWeight === progress.currentWeight
                ? "BASELINE LOCKED IN"
                : `↓ ${(progress.startWeight - progress.currentWeight).toFixed(1)} LBS SHED TOTAL`}
            </p>
          </div>

          <div className="border-t border-brand-border pt-4 mt-6 flex justify-between items-center text-xs">
            <span className="font-extrabold text-brand-text-muted uppercase">TARGET MASS:</span>
            <span className="font-black text-brand-text">{progress.targetWeight} LBS</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* WORKOUT OF THE DAY (WOD) - 2 Columns wide */}
        <div className="lg:col-span-2 bg-brand-card text-brand-text border-2 border-brand-orange p-6 md:p-8 rounded-none relative overflow-hidden flex flex-col justify-between shadow-[0_0_20px_rgba(255,84,0,0.05)]">
          {/* Subtle Background Accent */}
          <div className="absolute right-0 top-0 text-brand-bg font-black text-[120px] select-none pointer-events-none transform translate-x-8 -translate-y-12 italic leading-none opacity-40">
            WOD
          </div>

          <div className="relative z-10">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] tracking-[0.2em] font-extrabold bg-brand-orange text-black px-2.5 py-0.5 rounded-none uppercase leading-none">
                TODAY&apos;S WOD
              </span>
              <span className="text-[10px] tracking-[0.2em] font-extrabold bg-brand-bg text-brand-orange px-2.5 py-0.5 border border-brand-border uppercase leading-none">
                {wod.intensity} INTENSITY
              </span>
              <span className="text-[10px] tracking-[0.2em] font-extrabold text-brand-text-muted ml-auto uppercase leading-none">
                {wod.duration}
              </span>
            </div>

            <h3 className="text-2xl md:text-3xl font-black tracking-tight mt-5 italic text-brand-text uppercase">
              {wod.title}
            </h3>
            <p className="text-brand-text-muted text-sm mt-2 max-w-xl leading-relaxed">
              {wod.description}
            </p>

            <div className="mt-8 border-t border-brand-border pt-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-[1px] w-4 bg-brand-orange" />
                <p className="text-[10px] font-black tracking-[0.2em] text-brand-text-muted uppercase">
                  COMBAT LINEUP: <span className="text-brand-text/60">PREPARE FOR IMPACT</span>
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {wod.exercises.slice(0, 4).map((ex, i) => (
                  <div key={ex.name} className="flex items-center gap-4 bg-brand-bg/40 p-4 border border-brand-border hover:bg-brand-orange/5 hover:border-brand-orange/20 transition-all duration-200">
                    <span className="font-black text-xl text-brand-border-strong group-hover:text-brand-orange/50 transition-colors italic">0{i + 1}</span>
                    <div>
                      <p className="text-sm font-black text-brand-text uppercase italic">{ex.name}</p>
                      <p className="text-[10px] font-bold text-brand-text-muted tracking-widest uppercase mt-0.5">
                        {ex.sets} SETS <span className="text-brand-orange/50">×</span> {ex.reps}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-8 pt-4">
            <Link
              href={`/workouts/${wod.id}`}
              className="btn-assault inline-flex w-full sm:w-auto"
            >
              <span className="inline-flex items-center">
                ENGAGE WORKOUT
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-4 h-4 ml-2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </Link>
          </div>
        </div>

        {/* UPCOMING OMAD FEAST */}
        <div className="panel-aggressive flex flex-col justify-between">
          <div>
            <span className="label-micro">
              UPCOMING OMAD FEAST
            </span>
            <h3 className="text-xl font-black tracking-tight mt-4 text-brand-text italic uppercase">
              {nextMeal.title}
            </h3>
            <p className="text-brand-text-muted text-xs mt-2 leading-relaxed">
              {nextMeal.description}
            </p>

            <div className="grid grid-cols-2 gap-2 mt-6">
              <div className="bg-brand-bg p-2.5 border border-brand-border text-center">
                <p className="text-[9px] text-brand-text-muted font-extrabold uppercase">CALORIES</p>
                <p className="text-base font-black text-brand-text">{nextMeal.calories}</p>
              </div>
              <div className="bg-brand-bg p-2.5 border border-brand-border text-center">
                <p className="text-[9px] text-brand-text-muted font-extrabold uppercase">PROTEIN</p>
                <p className="text-base font-black text-brand-orange">{nextMeal.protein}g</p>
              </div>
              <div className="bg-brand-bg p-2.5 border border-brand-border text-center">
                <p className="text-[9px] text-brand-text-muted font-extrabold uppercase">FAT</p>
                <p className="text-base font-black text-brand-text">{nextMeal.fat}g</p>
              </div>
              <div className="bg-brand-bg p-2.5 border border-brand-border text-center">
                <p className="text-[9px] text-brand-text-muted font-extrabold uppercase">NET CARBS</p>
                <p className="text-base font-black text-brand-safe">{nextMeal.netCarbs}g</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-brand-border">
            <Link
              href="/meals"
              className="inline-flex items-center justify-center border border-brand-border hover:border-brand-border-strong font-black text-[10px] tracking-widest px-4 py-3.5 w-full text-center text-brand-text transition-all duration-150 uppercase"
            >
              VIEW NUTRITION PLAN
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
