import Link from "next/link";
import { prisma } from "@/lib/prisma";
import WorkoutTracker from "./WorkoutTracker";

export default async function WorkoutDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const workout = await prisma.workout.findUnique({
    where: { id },
    include: { exercises: true },
  });

  if (!workout) {
    return (
      <div className="text-center py-16 space-y-6 max-w-md mx-auto">
        <h1 className="text-2xl font-black text-brand-danger uppercase italic">REGIMEN NOT FOUND</h1>
        <p className="text-brand-text-muted text-sm">
          The requested training protocol does not exist or has been archived. Check your target parameters.
        </p>
        <Link
          href="/workouts"
          className="btn-assault inline-flex"
        >
          <span>RETURN TO TRAINING LIST</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with back navigation */}
      <div>
        <Link
          href="/workouts"
          className="inline-flex items-center text-xs text-brand-text-muted hover:text-brand-orange font-black uppercase tracking-widest gap-2 mb-4 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-3.5 h-3.5 animate-pulse"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          BACK TO REGIMENS
        </Link>

        <div className="relative border-l-8 border-brand-orange pl-6 md:pl-8 py-4 bg-brand-card/40 backdrop-blur-sm border-r border-y border-brand-border shadow-[20px_20px_40px_-20px_rgba(0,0,0,0.5)]">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] tracking-[0.2em] font-extrabold bg-brand-bg text-brand-orange px-2.5 py-1 border border-brand-border uppercase leading-none">
              {workout.category}
            </span>
            <span className="text-xs text-brand-text-muted font-black uppercase tracking-wider">
              {workout.duration} • {workout.target} • {workout.caloriesBurn} KCAL
            </span>
          </div>
          <h1 className="heading-mega mt-2">
            {workout.title}
          </h1>
        </div>
      </div>

      <WorkoutTracker workout={{ 
        ...workout, 
        intensity: workout.intensity as "HIGH" | "EXtreme" | "ANARCHIC" | "MEDIUM",
        category: workout.category as "METCON" | "STRENGTH" | "AMRAP" | "ENDURANCE",
        target: workout.target,
        exercises: workout.exercises.map(ex => ({
            ...ex,
            notes: ex.notes ?? undefined
        }))
      }} />
    </div>
  );
}
