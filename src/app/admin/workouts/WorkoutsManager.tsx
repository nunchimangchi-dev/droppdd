"use client";

import { useState } from "react";
import WorkoutForm from "./WorkoutForm";
import { deleteWorkout } from "../catalog-actions";

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string | null;
}

interface Workout {
  id: string;
  title: string;
  description: string;
  duration: string;
  intensity: string;
  category: string;
  target: string;
  caloriesBurn: number;
  exercises: Exercise[];
}

interface WorkoutsManagerProps {
  workouts: Workout[];
}

export default function WorkoutsManager({ workouts }: WorkoutsManagerProps) {
  const [view, setView] = useState<"LIST" | "ADD" | "EDIT">("LIST");
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleEditClick = (workout: Workout) => {
    setSelectedWorkout(workout);
    setView("EDIT");
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workout? This action cannot be undone.")) return;
    setLoadingId(id);
    try {
      await deleteWorkout(id);
    } catch (err) {
      console.error(err);
      alert("Deletion failed.");
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {view === "LIST" && (
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h2 className="text-lg font-black tracking-wider text-brand-text-muted uppercase flex items-center gap-2">
            <span className="w-1.5 h-6 bg-brand-orange block" />
            WORKOUTS CATALOG ({workouts.length})
          </h2>
          <button
            onClick={() => setView("ADD")}
            className="btn-assault"
          >
            <span>+ PROVISION NEW WORKOUT</span>
          </button>
        </div>
      )}

      {view === "ADD" && (
        <div className="panel-aggressive">
          <h2 className="text-xl font-black italic tracking-tight text-brand-orange uppercase mb-6">
            PROVISION NEW TRAINING WORKOUT
          </h2>
          <WorkoutForm onCancel={() => setView("LIST")} />
        </div>
      )}

      {view === "EDIT" && selectedWorkout && (
        <div className="panel-aggressive">
          <h2 className="text-xl font-black italic tracking-tight text-brand-orange uppercase mb-6">
            EDIT TRAINING WORKOUT: {selectedWorkout.title}
          </h2>
          <WorkoutForm
            workout={{
              ...selectedWorkout,
              exercises: selectedWorkout.exercises.map((ex) => ({
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                rest: ex.rest,
                notes: ex.notes ?? undefined,
              })),
            }}
            onCancel={() => {
              setView("LIST");
              setSelectedWorkout(null);
            }}
          />
        </div>
      )}

      {view === "LIST" && (
        <div className="space-y-4">
          {workouts.length === 0 ? (
            <p className="text-sm text-brand-text-muted font-bold uppercase tracking-wider">
              No workouts currently found in database.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {workouts.map((workout) => (
                <div
                  key={workout.id}
                  className="panel-aggressive flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-4 flex-wrap">
                      <span className="text-[9px] font-black tracking-widest bg-brand-orange/15 border border-brand-orange/20 text-brand-orange px-2 py-0.5 uppercase leading-none">
                        {workout.category}
                      </span>
                      <span className="text-[10px] font-extrabold text-brand-text-muted uppercase leading-none">
                        ID: {workout.id}
                      </span>
                    </div>

                    <h3 className="text-xl font-black italic tracking-tight text-brand-text uppercase mt-4">
                      {workout.title}
                    </h3>
                    <p className="text-[10px] font-extrabold tracking-widest text-brand-text-muted uppercase leading-none mt-1">
                      {workout.duration} • {workout.intensity} INTENSITY • {workout.exercises.length} EXERCISES
                    </p>

                    <p className="text-xs text-brand-text-muted mt-3 line-clamp-2 uppercase font-bold">
                      {workout.description}
                    </p>
                  </div>

                  <div className="flex gap-2 mt-6 pt-4 border-t border-brand-border/60">
                    <button
                      onClick={() => handleEditClick(workout)}
                      className="text-[10px] font-black tracking-[0.15em] uppercase px-3 py-2 bg-brand-orange/10 text-brand-orange border border-brand-orange/20 hover:bg-brand-orange hover:text-black transition-colors cursor-pointer"
                    >
                      EDIT DETAILS
                    </button>
                    <button
                      disabled={loadingId === workout.id}
                      onClick={() => handleDeleteClick(workout.id)}
                      className="text-[10px] font-black tracking-[0.15em] uppercase px-3 py-2 bg-transparent text-brand-danger/60 border border-brand-danger/20 hover:border-brand-danger hover:text-black transition-colors cursor-pointer"
                    >
                      {loadingId === workout.id ? "DELETING..." : "DELETE"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
