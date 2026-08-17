"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Workout } from "@/lib/mock-data";

interface WorkoutTrackerProps {
  workout: Workout;
}

export default function WorkoutTracker({ workout }: WorkoutTrackerProps) {
  // Track completed sets for each exercise: { [exerciseName]: [boolean, boolean, ...] }
  const [completedSets, setCompletedSets] = useState<{ [key: string]: boolean[] }>(() => {
    const initial: { [key: string]: boolean[] } = {};
    workout.exercises.forEach((ex) => {
      initial[ex.name] = Array(ex.sets).fill(false);
    });
    return initial;
  });

  // Timer states
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sound effects or visual flashes on completion
  const [timerAlert, setTimerAlert] = useState<boolean>(false);
  const [workoutFinished, setWorkoutFinished] = useState<boolean>(false);

  // Handle set completion toggle
  const toggleSet = (exName: string, setIndex: number) => {
    setCompletedSets((prev) => {
      const updated = { ...prev };
      const sets = [...updated[exName]];
      sets[setIndex] = !sets[setIndex];
      updated[exName] = sets;
      return updated;
    });
  };

  // Start rest timer
  const startTimer = (seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(seconds);
    setTimerActive(true);
    setTimerAlert(false);
  };

  // Pause/Resume/Cancel Timer
  const cancelTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerActive(false);
    setTimeLeft(0);
  };

  useEffect(() => {
    if (!timerActive) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimerActive(false);
          setTimerAlert(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive]);

  // Calculate overall workout completion progress
  const totalSetsCount = workout.exercises.reduce((acc, ex) => acc + ex.sets, 0);
  const completedSetsCount = Object.values(completedSets).reduce(
    (acc, setsList) => acc + setsList.filter(Boolean).length,
    0
  );
  const percentComplete = Math.round((completedSetsCount / totalSetsCount) * 100);

  const handleFinishWorkout = () => {
    setWorkoutFinished(true);
    cancelTimer();
  };

  if (workoutFinished) {
    return (
      <div className="bg-black text-zinc-100 border-2 border-orange-500 p-8 text-center max-w-xl mx-auto space-y-6 animate-scale-up">
        <div className="text-6xl">🏆</div>
        <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter text-orange-500 uppercase">
          ASSAULT COMPLETE
        </h2>
        <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed uppercase tracking-wider">
          YOU CONQUERED <span className="text-zinc-50 font-extrabold">{workout.title}</span>.
          YOU TOOK THE PAIN, EMBRACED THE STRUGGLE, AND SHREDDED YOUR EXCUSES.
        </p>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-[10px] text-zinc-500 font-extrabold uppercase">DURATION</p>
            <p className="text-xl font-black text-zinc-100">{workout.duration}</p>
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 font-extrabold uppercase">CALORIES SCORCHED</p>
            <p className="text-xl font-black text-orange-500">~{workout.caloriesBurn} KCAL</p>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="bg-orange-500 hover:bg-orange-600 text-black font-black text-xs tracking-widest px-6 py-3.5 transition-all duration-150 uppercase text-center"
          >
            RETURN TO DASHBOARD
          </Link>
          <Link
            href="/workouts"
            className="border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 text-zinc-300 font-black text-xs tracking-widest px-6 py-3.5 transition-all duration-150 uppercase text-center"
          >
            TRAIN AGAIN
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upper Tracker Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Card */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] tracking-[0.2em] font-extrabold text-orange-500 uppercase">
              ACTIVE SESSION PROGRESS
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                {percentComplete}%
              </h3>
              <span className="text-xs font-black text-zinc-500 uppercase">
                ({completedSetsCount} / {totalSetsCount} sets)
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-zinc-200 dark:bg-zinc-900 h-2 rounded-none overflow-hidden">
              <div
                className="bg-orange-500 h-full transition-all duration-350"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>
        </div>

        {/* REST TIMER COMPONENT */}
        <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 p-6 rounded-sm text-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-[10px] tracking-[0.2em] font-extrabold text-orange-500 uppercase block">
              TACTICAL REST TIMER
            </span>
            <p className="text-xs text-zinc-400">
              Trigger rest intervals between your massive combat sets. Let your heart recover before the next strike.
            </p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
              <button
                onClick={() => startTimer(30)}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-extrabold text-[10px] tracking-wider px-3 py-1.5 uppercase rounded-none transition-colors"
              >
                +30S
              </button>
              <button
                onClick={() => startTimer(60)}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-extrabold text-[10px] tracking-wider px-3 py-1.5 uppercase rounded-none transition-colors"
              >
                +60S
              </button>
              <button
                onClick={() => startTimer(90)}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-extrabold text-[10px] tracking-wider px-3 py-1.5 uppercase rounded-none transition-colors"
              >
                +90S
              </button>
              <button
                onClick={() => startTimer(120)}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-extrabold text-[10px] tracking-wider px-3 py-1.5 uppercase rounded-none transition-colors"
              >
                +120S
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-3 bg-zinc-900/50 border border-zinc-900 min-w-[140px] h-28 relative">
            {timerActive ? (
              <div className="text-center space-y-1">
                <p className="text-3xl font-black text-orange-500 tabular-nums animate-pulse">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                </p>
                <button
                  onClick={cancelTimer}
                  className="text-[9px] font-extrabold tracking-widest text-red-500 hover:text-red-400 uppercase"
                >
                  CANCEL
                </button>
              </div>
            ) : timerAlert ? (
              <div className="text-center space-y-2 animate-bounce">
                <p className="text-xs font-black text-red-500 uppercase tracking-widest">REST UP!</p>
                <button
                  onClick={() => setTimerAlert(false)}
                  className="bg-red-500 text-black text-[9px] font-black px-2 py-1 uppercase"
                >
                  DISMISS
                </button>
              </div>
            ) : (
              <div className="text-center text-zinc-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8 mx-auto mb-1 opacity-40"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                <p className="text-[10px] font-black tracking-widest uppercase">IDLE</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exercises Combat List */}
      <div className="space-y-6">
        <h3 className="text-lg font-black tracking-wider text-zinc-400 uppercase">
          COMBAT ENGAGEMENTS IN SEQUENCE:
        </h3>

        <div className="space-y-4">
          {workout.exercises.map((ex, exIdx) => (
            <div
              key={ex.name}
              className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-5 md:p-6 rounded-sm shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-lg text-orange-500">0{exIdx + 1}</span>
                    <h4 className="text-lg font-black text-zinc-900 dark:text-zinc-50">{ex.name}</h4>
                  </div>
                  <p className="text-xs text-zinc-500 font-extrabold uppercase mt-1">
                    {ex.sets} sets × {ex.reps} •{" "}
                    {ex.rest === "None" || ex.rest === "No rest"
                      ? "No rest"
                      : `${ex.rest} rest`}
                  </p>
                  {ex.notes && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 bg-zinc-50 dark:bg-zinc-900/50 p-3 border-l-2 border-zinc-300 dark:border-zinc-800">
                      💡 {ex.notes}
                    </p>
                  )}
                </div>

                {/* Rest recommendation quick trigger */}
                {ex.rest !== "None" && ex.rest !== "No rest" && (
                  <button
                    onClick={() => {
                      const seconds = ex.rest.toLowerCase().includes("120s")
                        ? 120
                        : ex.rest.toLowerCase().includes("90s")
                        ? 90
                        : 60;
                      startTimer(seconds);
                    }}
                    className="self-start text-[10px] bg-zinc-100 dark:bg-zinc-900 hover:bg-orange-500 hover:text-black border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-black px-3 py-1.5 uppercase transition-all"
                  >
                    ⏱️ START {ex.rest} REST
                  </button>
                )}
              </div>

              {/* Set Checkboxes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-6 border-t border-zinc-100 dark:border-zinc-900 pt-4">
                {Array(ex.sets)
                  .fill(0)
                  .map((_, setIdx) => {
                    const isDone = completedSets[ex.name]?.[setIdx] || false;
                    return (
                      <button
                        key={setIdx}
                        onClick={() => toggleSet(ex.name, setIdx)}
                        className={`flex items-center justify-between p-3 border rounded-none transition-all duration-150 ${
                          isDone
                            ? "bg-orange-500/10 border-orange-500 text-orange-500 font-black"
                            : "bg-zinc-50 dark:bg-zinc-900/20 border-zinc-200 dark:border-zinc-900 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 font-semibold"
                        }`}
                      >
                        <span className="text-[10px] tracking-wider uppercase">SET {setIdx + 1}</span>
                        <div
                          className={`w-4 h-4 border flex items-center justify-center ${
                            isDone
                              ? "border-orange-500 bg-orange-500 text-black"
                              : "border-zinc-300 dark:border-zinc-700 bg-transparent"
                          }`}
                        >
                          {isDone && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={3}
                              stroke="currentColor"
                              className="w-3 h-3"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Finish Action */}
      <div className="pt-6 border-t border-zinc-200 dark:border-zinc-900 flex flex-col sm:flex-row justify-between items-center gap-4">
        <Link
          href="/workouts"
          className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-black uppercase tracking-widest flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          ABANDON ENGAGEMENT
        </Link>

        <button
          onClick={handleFinishWorkout}
          className="bg-orange-500 hover:bg-orange-600 text-black font-black text-xs tracking-widest px-8 py-4 w-full sm:w-auto transition-all duration-150 uppercase"
        >
          FINISH WORKOUT & CLAIM VICTORY
        </button>
      </div>
    </div>
  );
}
