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
      <div className="bg-brand-card text-brand-text border-2 border-brand-orange p-8 text-center max-w-xl mx-auto space-y-6 animate-scale-up shadow-[0_0_30px_rgba(255,84,0,0.1)] relative">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] hazard-stripes" />
        <div className="text-6xl">🏆</div>
        <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter text-brand-orange uppercase">
          ASSAULT COMPLETE
        </h2>
        <p className="text-sm text-brand-text-muted max-w-md mx-auto leading-relaxed uppercase tracking-wider">
          YOU CONQUERED <span className="text-brand-text font-extrabold">{workout.title}</span>.
          YOU TOOK THE PAIN, EMBRACED THE STRUGGLE, AND SHREDDED YOUR EXCUSES.
        </p>

        <div className="bg-brand-bg border border-brand-border p-4 rounded-none grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-[10px] text-brand-text-muted font-extrabold uppercase">DURATION</p>
            <p className="text-xl font-black text-brand-text italic">{workout.duration}</p>
          </div>
          <div>
            <p className="text-[10px] text-brand-text-muted font-extrabold uppercase">CALORIES SCORCHED</p>
            <p className="text-xl font-black text-brand-orange italic">~{workout.caloriesBurn} KCAL</p>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="btn-assault inline-flex text-center"
          >
            <span>RETURN TO DASHBOARD</span>
          </Link>
          <Link
            href="/workouts"
            className="border border-brand-border hover:border-brand-border-strong hover:bg-brand-card-hover text-brand-text font-black text-xs tracking-widest px-6 py-4 transition-all duration-150 uppercase text-center"
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
        <div className="panel-aggressive flex flex-col justify-between">
          <div>
            <span className="text-[10px] tracking-[0.2em] font-extrabold text-brand-orange uppercase leading-none">
              ACTIVE SESSION PROGRESS
            </span>
            <div className="flex items-baseline gap-2 mt-4">
              <h3 className="text-4xl font-black tracking-tight text-brand-text italic uppercase leading-none">
                {percentComplete}%
              </h3>
              <span className="text-xs font-black text-brand-text-muted uppercase italic">
                ({completedSetsCount} / {totalSetsCount} sets)
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-brand-bg h-2 rounded-none overflow-hidden">
              <div
                className="bg-brand-orange h-full transition-all duration-350"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>
        </div>

        {/* REST TIMER COMPONENT */}
        <div className="lg:col-span-2 bg-brand-card border border-brand-border p-6 rounded-none text-brand-text flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center sm:text-left">
            <span className="text-[10px] tracking-[0.2em] font-extrabold text-brand-orange uppercase block leading-none">
              TACTICAL REST TIMER
            </span>
            <p className="text-xs text-brand-text-muted max-w-md">
              Trigger rest intervals between your massive combat sets. Let your heart recover before the next strike.
            </p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
              {[30, 60, 90, 120].map((sec) => (
                <button
                  key={sec}
                  onClick={() => startTimer(sec)}
                  className="bg-brand-bg hover:bg-brand-orange hover:text-black border border-brand-border text-brand-text font-black text-[10px] tracking-wider px-3.5 py-2 uppercase rounded-none transition-all cursor-pointer"
                >
                  +{sec}S
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-3 bg-brand-bg border border-brand-border min-w-[145px] h-28 relative">
            {timerActive ? (
              <div className="text-center space-y-1">
                <p className="text-3xl font-black text-brand-orange tabular-nums animate-pulse italic leading-none">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                </p>
                <button
                  onClick={cancelTimer}
                  className="text-[9px] font-extrabold tracking-widest text-brand-danger hover:text-red-400 uppercase cursor-pointer"
                >
                  CANCEL
                </button>
              </div>
            ) : timerAlert ? (
              <div className="text-center space-y-2 animate-bounce">
                <p className="text-xs font-black text-brand-danger uppercase tracking-widest leading-none">REST UP!</p>
                <button
                  onClick={() => setTimerAlert(false)}
                  className="bg-brand-danger text-black text-[9px] font-black px-2.5 py-1.5 uppercase cursor-pointer"
                >
                  DISMISS
                </button>
              </div>
            ) : (
              <div className="text-center text-brand-text-muted/40">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8 mx-auto mb-1 opacity-30"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                <p className="text-[10px] font-black tracking-widest uppercase leading-none">IDLE</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exercises Combat List */}
      <div className="space-y-6">
        <h3 className="text-lg font-black tracking-wider text-brand-text-muted uppercase">
          COMBAT ENGAGEMENTS IN SEQUENCE:
        </h3>

        <div className="space-y-5">
          {workout.exercises.map((ex, exIdx) => (
            <div
              key={ex.name}
              className="panel-aggressive space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-xl text-brand-orange italic">0{exIdx + 1}</span>
                    <h4 className="text-xl font-black text-brand-text uppercase italic">{ex.name}</h4>
                  </div>
                  <p className="text-xs text-brand-text-muted font-extrabold uppercase mt-1">
                    {ex.sets} SETS × {ex.reps} REPS •{" "}
                    {ex.rest === "None" || ex.rest === "No rest"
                      ? "NO REST RESTRICTION"
                      : `${ex.rest} TACTICAL REST`}
                  </p>
                  {ex.notes && (
                    <p className="text-xs text-brand-text-muted mt-3 bg-brand-bg border-l-2 border-brand-orange/40 p-3">
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
                    className="self-start text-[10px] bg-brand-bg hover:bg-brand-orange hover:text-black border border-brand-border text-brand-text font-black px-3.5 py-2 uppercase transition-all cursor-pointer"
                  >
                    ⏱️ START {ex.rest} REST
                  </button>
                )}
              </div>

              {/* Set Checkboxes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-6 border-t border-brand-border pt-4">
                {Array(ex.sets)
                  .fill(0)
                  .map((_, setIdx) => {
                    const isDone = completedSets[ex.name]?.[setIdx] || false;
                    return (
                      <button
                        key={setIdx}
                        onClick={() => toggleSet(ex.name, setIdx)}
                        className={`flex items-center justify-between p-3 border rounded-none transition-all duration-150 cursor-pointer ${
                          isDone
                            ? "bg-brand-orange/15 border-brand-orange text-brand-orange font-black"
                            : "bg-brand-bg border-brand-border text-brand-text-muted hover:border-brand-border-strong hover:text-brand-text font-bold"
                        }`}
                      >
                        <span className="text-[10px] tracking-wider uppercase">SET {setIdx + 1}</span>
                        <div
                          className={`w-4 h-4 border flex items-center justify-center ${
                            isDone
                              ? "border-brand-orange bg-brand-orange text-black"
                              : "border-brand-border bg-transparent"
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
      <div className="pt-6 border-t border-brand-border flex flex-col sm:flex-row justify-between items-center gap-4">
        <Link
          href="/workouts"
          className="text-xs text-brand-text-muted hover:text-brand-orange font-black uppercase tracking-widest flex items-center gap-2 transition-colors"
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
          className="btn-assault w-full sm:w-auto"
        >
          <span>FINISH WORKOUT & CLAIM VICTORY</span>
        </button>
      </div>
    </div>
  );
}
