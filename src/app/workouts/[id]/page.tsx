import Link from "next/link";
import { mockWorkouts } from "@/lib/mock-data";
import WorkoutTracker from "./WorkoutTracker";

export default async function WorkoutDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const workout = mockWorkouts.find((w) => w.id === id);

  if (!workout) {
    return (
      <div className="text-center py-16 space-y-4">
        <h1 className="text-2xl font-black text-red-500 uppercase">REGIMEN NOT FOUND</h1>
        <p className="text-zinc-500 max-w-md mx-auto text-sm">
          The requested training protocol does not exist or has been archived. Check your target parameters.
        </p>
        <Link
          href="/workouts"
          className="inline-block bg-orange-500 text-black font-black text-xs tracking-widest px-6 py-3 uppercase"
        >
          RETURN TO TRAINING LIST
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
          className="inline-flex items-center text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-black uppercase tracking-widest gap-2 mb-4 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-3.5 h-3.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          BACK TO REGIMENS
        </Link>

        <div className="border-l-4 border-orange-500 pl-4 md:pl-6 py-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] tracking-[0.2em] font-extrabold bg-zinc-900 text-orange-500 px-2 py-0.5 border border-zinc-850 uppercase">
              {workout.category}
            </span>
            <span className="text-xs text-zinc-500 font-black uppercase">
              {workout.duration} • {workout.target}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-zinc-900 dark:text-zinc-50 mt-1 italic">
            {workout.title}
          </h1>
        </div>
      </div>

      <WorkoutTracker workout={workout} />
    </div>
  );
}
