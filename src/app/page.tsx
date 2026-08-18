import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { mockOMAD } from "@/lib/mock-data";

export default async function Dashboard() {
  const wod = await prisma.workout.findFirst({
    include: { exercises: true },
  });
  const nextMeal = await prisma.meal.findFirst();
  const progress = await prisma.progress.findFirst();

  if (!wod || !nextMeal || !progress) {
    return <div>Data not found</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Aggressive Hero Header */}
      <div className="relative border-l-8 border-orange-500 pl-6 md:pl-8 py-4 bg-zinc-950/40 backdrop-blur-sm border-r border-y border-zinc-900 shadow-[20px_20px_40px_-20px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0H100V10H0V0ZM0 20H100V30H0V20ZM0 40H100V50H0V40ZM0 60H100V70H0V60ZM0 80H100V90H0V80Z" fill="currentColor" />
          </svg>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-zinc-900 dark:text-zinc-50 italic transform -skew-x-2">
          DAILY <span className="text-orange-500">ASSAULT</span>
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs md:text-sm font-black tracking-[0.3em] uppercase mt-2 leading-none">
          TODAY IS A GOOD DAY TO <span className="text-zinc-200">SUFFER</span>. NO REASONABLE EXCUSES.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* FASTING STATUS / OMAD */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] tracking-[0.2em] font-extrabold text-orange-500 uppercase">
                FASTING WINDOW (OMAD)
              </span>
              <span className="text-xs font-black bg-orange-500/10 text-orange-500 px-2.5 py-0.5 rounded-sm border border-orange-500/20 uppercase">
                {mockOMAD.status}
              </span>
            </div>
            <h2 className="text-4xl font-black tracking-tight mt-3 text-zinc-900 dark:text-zinc-50">
              {mockOMAD.timeRemaining}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-extrabold uppercase mt-1">
              REMAINING UNTIL FEAST
            </p>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase mb-1">
              <span>{mockOMAD.hoursCompleted} hrs done</span>
              <span>{mockOMAD.hoursTotal} hrs total</span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-900 h-2 rounded-none overflow-hidden">
              <div
                className="bg-orange-500 h-full transition-all duration-300"
                style={{ width: `${mockOMAD.percentComplete}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-400 font-medium mt-2">
              Eating window scheduled: {mockOMAD.windowStart} - {mockOMAD.windowEnd}
            </p>
          </div>
        </div>

        {/* STREAK */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] tracking-[0.2em] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase">
              CONSISTENCY
            </span>
            <div className="flex items-baseline gap-2 mt-3">
              <h2 className="text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                {progress.currentStreak}
              </h2>
              <span className="text-xl font-black text-orange-500">DAYS</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-extrabold uppercase mt-1">
              STREAK 🔥 ACTIVE & STRONG
            </p>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-900 pt-4 mt-6 flex justify-between items-center text-xs">
            <span className="font-extrabold text-zinc-400 uppercase">ALL-TIME RECORD:</span>
            <span className="font-black text-zinc-800 dark:text-zinc-200">{progress.bestStreak} DAYS</span>
          </div>
        </div>

        {/* WEIGHT PROGRESS */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] tracking-[0.2em] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase">
              BODY WEIGHT TREND
            </span>
            <div className="flex items-baseline gap-1 mt-3">
              <h2 className="text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                {progress.currentWeight}
              </h2>
              <span className="text-sm font-black text-zinc-400">LBS</span>
            </div>
            <p className="text-xs text-green-500 font-extrabold uppercase mt-1">
              ↓ {(progress.startWeight - progress.currentWeight).toFixed(1)} LBS SHED TOTAL
            </p>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-900 pt-4 mt-6 flex justify-between items-center text-xs">
            <span className="font-extrabold text-zinc-400 uppercase">TARGET MASS:</span>
            <span className="font-black text-zinc-800 dark:text-zinc-200">{progress.targetWeight} LBS</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* WORKOUT OF THE DAY (WOD) - 2 Columns wide */}
        <div className="lg:col-span-2 bg-zinc-950 text-zinc-100 border-2 border-orange-500 p-6 md:p-8 rounded-sm relative overflow-hidden flex flex-col justify-between">
          {/* Subtle Background Accent */}
          <div className="absolute right-0 top-0 text-zinc-900 font-black text-[120px] select-none pointer-events-none transform translate-x-8 -translate-y-12 italic leading-none opacity-30">
            WOD
          </div>

          <div className="relative z-10">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] tracking-[0.2em] font-extrabold bg-orange-500 text-black px-2 py-0.5 rounded-none uppercase">
                TODAY&apos;S WOD
              </span>
              <span className="text-[10px] tracking-[0.2em] font-extrabold bg-zinc-900 text-orange-500 px-2 py-0.5 border border-zinc-800 uppercase">
                {wod.intensity} INTENSITY
              </span>
              <span className="text-[10px] tracking-[0.2em] font-extrabold text-zinc-400 ml-auto uppercase">
                {wod.duration}
              </span>
            </div>

            <h3 className="text-2xl md:text-3xl font-black tracking-tight mt-4 italic text-zinc-50">
              {wod.title}
            </h3>
            <p className="text-zinc-400 text-sm mt-2 max-w-xl leading-relaxed">
              {wod.description}
            </p>

            <div className="mt-8 border-t border-zinc-900 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-[1px] w-4 bg-orange-500" />
                <p className="text-xs font-black tracking-[0.2em] text-zinc-500 uppercase">
                  COMBAT LINEUP: <span className="text-zinc-700">PREPARE FOR IMPACT</span>
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {wod.exercises.slice(0, 4).map((ex, i) => (
                  <div key={ex.name} className="flex items-center gap-4 bg-zinc-900/30 p-4 border border-zinc-900 group/item hover:bg-orange-500/5 hover:border-orange-500/20 transition-all duration-200">
                    <span className="font-black text-xl text-zinc-800 group-hover/item:text-orange-500/50 transition-colors italic">0{i + 1}</span>
                    <div>
                      <p className="text-sm font-black text-zinc-200 group-hover/item:text-zinc-50 transition-colors uppercase italic">{ex.name}</p>
                      <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mt-0.5">
                        {ex.sets} SETS <span className="text-orange-500/50">×</span> {ex.reps}
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
              className="inline-flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-black font-black text-xs tracking-widest px-6 py-3.5 w-full sm:w-auto transition-all duration-150 uppercase"
            >
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
            </Link>
          </div>
        </div>

        {/* UPCOMING OMAD FEAST */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] tracking-[0.2em] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase">
              UPCOMING OMAD FEAST
            </span>
            <h3 className="text-xl font-black tracking-tight mt-3 text-zinc-900 dark:text-zinc-50 italic">
              {nextMeal.title}
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-2 leading-relaxed">
              {nextMeal.description}
            </p>

            <div className="grid grid-cols-2 gap-2 mt-6">
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2.5 border border-zinc-100 dark:border-zinc-900 text-center">
                <p className="text-[10px] text-zinc-400 font-extrabold uppercase">CALORIES</p>
                <p className="text-lg font-black text-zinc-900 dark:text-zinc-50">{nextMeal.calories}</p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2.5 border border-zinc-100 dark:border-zinc-900 text-center">
                <p className="text-[10px] text-zinc-400 font-extrabold uppercase">PROTEIN</p>
                <p className="text-lg font-black text-orange-500">{nextMeal.protein}g</p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2.5 border border-zinc-100 dark:border-zinc-900 text-center">
                <p className="text-[10px] text-zinc-400 font-extrabold uppercase">FAT</p>
                <p className="text-lg font-black text-zinc-900 dark:text-zinc-50">{nextMeal.fat}g</p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2.5 border border-zinc-100 dark:border-zinc-900 text-center">
                <p className="text-[10px] text-zinc-400 font-extrabold uppercase">NET CARBS</p>
                <p className="text-lg font-black text-green-500">{nextMeal.netCarbs}g</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-900">
            <Link
              href="/meals"
              className="inline-flex items-center justify-center border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 font-black text-xs tracking-widest px-4 py-3 w-full text-center text-zinc-800 dark:text-zinc-200 transition-all duration-150 uppercase"
            >
              VIEW MEAL PLAN
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
