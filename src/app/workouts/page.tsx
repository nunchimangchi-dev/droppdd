import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function WorkoutsPage() {
  const workouts = await prisma.workout.findMany({
    include: { exercises: true },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Aggressive Section Header */}
      <div className="relative border-l-8 border-orange-500 pl-6 md:pl-8 py-4 bg-zinc-950/40 backdrop-blur-sm border-r border-y border-zinc-900 shadow-[20px_20px_40px_-20px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0H100V10H0V0ZM0 20H100V30H0V20ZM0 40H100V50H0V40ZM0 60H100V70H0V60ZM0 80H100V90H0V80Z" fill="currentColor" />
          </svg>
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-zinc-900 dark:text-zinc-50 italic transform -skew-x-2">
          TRAINING <span className="text-orange-500">REGIMEN</span>
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs md:text-sm font-black tracking-[0.3em] uppercase mt-2 leading-none">
          CHOOSE YOUR <span className="text-zinc-200">ASSAULT</span>. DISCIPLINE TRUMPS MOTIVATION.
        </p>
      </div>

      {/* Grid of Workouts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {workouts.map((workout) => (
          <div
            key={workout.id}
            className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 hover:border-orange-500/50 dark:hover:border-orange-500/50 p-6 flex flex-col justify-between transition-all duration-150 group"
          >
            <div>
              <div className="flex justify-between items-center flex-wrap gap-2">
                <span className="text-[10px] tracking-[0.2em] font-extrabold bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 uppercase">
                  {workout.category}
                </span>
                <span
                  className={`text-[10px] tracking-[0.2em] font-extrabold px-2 py-0.5 uppercase ${
                    workout.intensity === "ANARCHIC"
                      ? "bg-red-500/10 text-red-500 border border-red-500/20"
                      : workout.intensity === "EXtreme"
                      ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                      : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  }`}
                >
                  {workout.intensity} INTENSITY
                </span>
              </div>

              <h2 className="text-2xl font-black tracking-tight mt-4 italic text-zinc-900 dark:text-zinc-50 group-hover:text-orange-500 transition-colors">
                {workout.title}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-black tracking-widest uppercase mt-1">
                {workout.duration} • {workout.target} • {workout.caloriesBurn} KCAL
              </p>

              <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-3 leading-relaxed">
                {workout.description}
              </p>

              <div className="mt-6 border-t border-zinc-100 dark:border-zinc-900 pt-4">
                <p className="text-xs font-extrabold tracking-wider text-zinc-400 uppercase mb-2">
                  WORKOUT OVERVIEW ({workout.exercises.length} EXERCISES):
                </p>
                <div className="space-y-1.5">
                  {workout.exercises.map((ex) => (
                    <div key={ex.name} className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="font-semibold">{ex.name}</span>
                      <span className="font-black text-zinc-400">{ex.sets} × {ex.reps}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <Link
                href={`/workouts/${workout.id}`}
                className="inline-flex items-center justify-center bg-zinc-950 hover:bg-orange-500 dark:bg-zinc-900 dark:hover:bg-orange-500 text-zinc-200 hover:text-black dark:text-zinc-200 font-black text-xs tracking-widest px-5 py-3 w-full transition-all duration-150 uppercase border border-zinc-850 dark:border-zinc-800 hover:border-orange-500"
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
        ))}
      </div>
    </div>
  );
}
