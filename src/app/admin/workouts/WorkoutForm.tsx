"use client";

import { useState } from "react";
import { createWorkout, updateWorkout } from "../catalog-actions";

interface ExerciseInput {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
}

interface WorkoutFormProps {
  workout?: {
    id: string;
    title: string;
    description: string;
    duration: string;
    intensity: string;
    category: string;
    target: string;
    caloriesBurn: number;
    exercises: ExerciseInput[];
  };
  onCancel: () => void;
}

export default function WorkoutForm({ workout, onCancel }: WorkoutFormProps) {
  const [title, setTitle] = useState(workout?.title ?? "");
  const [description, setDescription] = useState(workout?.description ?? "");
  const [duration, setDuration] = useState(workout?.duration ?? "");
  const [intensity, setIntensity] = useState(workout?.intensity ?? "HIGH");
  const [category, setCategory] = useState(workout?.category ?? "METCON");
  const [target, setTarget] = useState(workout?.target ?? "");
  const [caloriesBurn, setCaloriesBurn] = useState(workout?.caloriesBurn ?? 0);
  
  const [exercises, setExercises] = useState<ExerciseInput[]>(
    workout?.exercises ?? [{ name: "", sets: 1, reps: "", rest: "", notes: "" }]
  );

  const [loading, setLoading] = useState(false);

  const handleAddExercise = () => {
    setExercises([...exercises, { name: "", sets: 1, reps: "", rest: "", notes: "" }]);
  };

  const handleRemoveExercise = (index: number) => {
    if (exercises.length === 1) return;
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleExerciseChange = (index: number, field: keyof ExerciseInput, value: string | number) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      title,
      description,
      duration,
      intensity,
      category,
      target,
      caloriesBurn,
      exercises,
    };

    try {
      if (workout) {
        await updateWorkout(workout.id, payload);
      } else {
        await createWorkout(payload);
      }
    } catch (err) {
      console.error(err);
      alert("Submission failed. Ensure all fields are valid.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block label-micro mb-1.5">Workout Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Hellfire Metcon"
            className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange px-4 py-2.5 text-sm font-bold tracking-wider uppercase text-brand-text placeholder-brand-text-muted/40 focus:outline-none"
          />
        </div>

        <div>
          <label className="block label-micro mb-1.5">Target Focus</label>
          <input
            type="text"
            required
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="e.g. FAT LOSS / CONDITIONING"
            className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange px-4 py-2.5 text-sm font-bold tracking-wider uppercase text-brand-text placeholder-brand-text-muted/40 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block label-micro mb-1.5">Description / Protocol Objective</label>
        <textarea
          required
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. High intensity conditioning designed to scorch calories..."
          className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange px-4 py-2.5 text-sm font-bold tracking-wider text-brand-text placeholder-brand-text-muted/40 focus:outline-none uppercase"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label className="block label-micro mb-1.5">Duration</label>
          <input
            type="text"
            required
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g. 45 MINS"
            className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange px-4 py-2.5 text-sm font-bold tracking-wider uppercase text-brand-text placeholder-brand-text-muted/40 focus:outline-none"
          />
        </div>

        <div>
          <label className="block label-micro mb-1.5">Intensity</label>
          <select
            value={intensity}
            onChange={(e) => setIntensity(e.target.value)}
            className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange px-4 py-2.5 text-sm font-bold tracking-wider uppercase text-brand-text focus:outline-none cursor-pointer"
          >
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="EXtreme">EXtreme</option>
            <option value="ANARCHIC">ANARCHIC</option>
          </select>
        </div>

        <div>
          <label className="block label-micro mb-1.5">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange px-4 py-2.5 text-sm font-bold tracking-wider uppercase text-brand-text focus:outline-none cursor-pointer"
          >
            <option value="METCON">METCON</option>
            <option value="STRENGTH">STRENGTH</option>
            <option value="AMRAP">AMRAP</option>
            <option value="ENDURANCE">ENDURANCE</option>
          </select>
        </div>

        <div>
          <label className="block label-micro mb-1.5">Calories Burn</label>
          <input
            type="number"
            required
            min={0}
            value={caloriesBurn}
            onChange={(e) => setCaloriesBurn(Number(e.target.value))}
            className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange px-4 py-2.5 text-sm font-bold tracking-wider uppercase text-brand-text focus:outline-none"
          />
        </div>
      </div>

      {/* Exercises repeatable section */}
      <div className="space-y-4 pt-4 border-t border-brand-border">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-black tracking-widest text-brand-text-muted uppercase italic">
            EXERCISES PROTOCOL ({exercises.length})
          </h3>
          <button
            type="button"
            onClick={handleAddExercise}
            className="text-[10px] font-black tracking-widest uppercase bg-brand-orange/10 border border-brand-orange/20 text-brand-orange px-3 py-1.5 hover:bg-brand-orange hover:text-black transition-colors"
          >
            + ADD EXERCISE
          </button>
        </div>

        <div className="space-y-4">
          {exercises.map((ex, idx) => (
            <div
              key={idx}
              className="p-4 bg-brand-bg/40 border border-brand-border space-y-3 relative"
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-brand-orange bg-brand-orange/15 px-2 py-0.5 rounded-none">
                  EXERCISE #{idx + 1}
                </span>
                {exercises.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(idx)}
                    className="text-[9px] font-black text-brand-danger hover:text-white transition-colors uppercase tracking-widest"
                  >
                    [REMOVE]
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-extrabold text-brand-text-muted uppercase mb-1">Exercise Name</label>
                  <input
                    type="text"
                    required
                    value={ex.name}
                    onChange={(e) => handleExerciseChange(idx, "name", e.target.value)}
                    placeholder="e.g. Barbell Thruster"
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange px-3 py-2 text-xs font-bold uppercase text-brand-text placeholder-brand-text-muted/30 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] font-extrabold text-brand-text-muted uppercase mb-1">Sets</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={ex.sets}
                      onChange={(e) => handleExerciseChange(idx, "sets", Number(e.target.value))}
                      className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange px-3 py-2 text-xs font-bold text-brand-text focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-extrabold text-brand-text-muted uppercase mb-1">Reps</label>
                    <input
                      type="text"
                      required
                      value={ex.reps}
                      onChange={(e) => handleExerciseChange(idx, "reps", e.target.value)}
                      placeholder="e.g. 10-12 or AMRAP"
                      className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange px-3 py-2 text-xs font-bold uppercase text-brand-text placeholder-brand-text-muted/30 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-extrabold text-brand-text-muted uppercase mb-1">Rest</label>
                    <input
                      type="text"
                      required
                      value={ex.rest}
                      onChange={(e) => handleExerciseChange(idx, "rest", e.target.value)}
                      placeholder="e.g. 60S"
                      className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange px-3 py-2 text-xs font-bold uppercase text-brand-text placeholder-brand-text-muted/30 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-brand-text-muted uppercase mb-1">Exercise Notes (Optional)</label>
                <input
                  type="text"
                  value={ex.notes ?? ""}
                  onChange={(e) => handleExerciseChange(idx, "notes", e.target.value)}
                  placeholder="e.g. Complete with explosive power"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange px-3 py-2 text-xs font-bold uppercase text-brand-text placeholder-brand-text-muted/30 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-4 border-t border-brand-border">
        <button
          type="submit"
          disabled={loading}
          className="btn-assault"
        >
          <span>{loading ? "SUBMITTING..." : workout ? "LOCK IN CHANGES" : "PROVISION WORKOUT"}</span>
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-black tracking-widest uppercase bg-transparent text-brand-text-muted border border-brand-border px-5 py-4 hover:border-brand-border-strong hover:text-brand-text transition-all"
        >
          CANCEL
        </button>
      </div>
    </form>
  );
}
