import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function WorkoutsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  if (!session?.user?.username) {
    redirect("/choose-username");
  }

  const workouts = await prisma.workout.findMany({
    include: { exercises: true },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Aggressive Section Header */}
      <div className="relative border-l-8 border-brand-orange pl-6 md:pl-8 py-4 bg-brand-card/40 backdrop-blur-sm border-r border-y border-brand-border shadow-[20px_20px_40px_-20px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0H100V10H0V0ZM0 20H100V30H0V20ZM0 40H100V50H0V40ZM0 60H100V70H0V60ZM0 80H100V90H0V80Z" fill="currentColor" className="text-brand-orange" />
          </svg>
        </div>
        <h1 className="heading-mega">
          TRAINING <span className="text-brand-orange">REGIMEN</span>
        </h1>
        <p className="text-brand-text-muted text-xs md:text-sm font-black tracking-[0.3em] uppercase mt-2 leading-none">
          CHOOSE YOUR <span className="text-brand-text">ASSAULT</span>. DISCIPLINE TRUMPS MOTIVATION.
        </p>
      </div>

      {/* Grid of Workouts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {workouts.map((workout) => (
          <div
            key={workout.id}
            className="panel-aggressive hover:border-brand-orange/50 flex flex-col justify-between group"
          >
            <div>
              <div className="flex justify-between items-center flex-wrap gap-2">
                <span className="text-[10px] tracking-[0.2em] font-extrabold bg-brand-bg text-brand-text-muted px-2.5 py-1 border border-brand-border uppercase leading-none">
                  {workout.category}
                </span>
                <span
                  className={`text-[10px] tracking-[0.2em] font-extrabold px-2.5 py-1 uppercase border leading-none ${
                    workout.intensity === "ANARCHIC"
                      ? "bg-brand-danger/10 text-brand-danger border-brand-danger/25"
                      : workout.intensity === "EXtreme"
                      ? "bg-brand-orange/10 text-brand-orange border-brand-orange/25"
                      : "bg-brand-warning/10 text-brand-warning border-brand-warning/25"
                  }`}
                >
                  {workout.intensity} INTENSITY
                </span>
              </div>

              <h2 className="text-2xl font-black tracking-tight mt-5 italic text-brand-text group-hover:text-brand-orange transition-colors uppercase">
                {workout.title}
              </h2>
              <p className="text-brand-text-muted text-xs font-black tracking-widest uppercase mt-1">
                {workout.duration} • {workout.target} • {workout.caloriesBurn} KCAL SCORCHED
              </p>

              <p className="text-brand-text-muted/80 text-sm mt-3 leading-relaxed">
                {workout.description}
              </p>

              <div className="mt-6 border-t border-brand-border pt-4">
                <p className="text-xs font-extrabold tracking-wider text-brand-text-muted uppercase mb-2">
                  WORKOUT LINEUP ({workout.exercises.length} EXERCISES):
                </p>
                <div className="space-y-1.5">
                  {workout.exercises.map((ex) => (
                    <div key={ex.name} className="flex justify-between text-xs text-brand-text/80">
                      <span className="font-semibold uppercase">{ex.name}</span>
                      <span className="font-black text-brand-text-muted">{ex.sets} × {ex.reps}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4">
              <Link
                href={`/workouts/${workout.id}`}
                className="btn-assault inline-flex w-full text-center"
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
        ))}
      </div>
    </div>
  );
}
