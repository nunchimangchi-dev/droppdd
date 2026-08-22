"use client";

import { useState } from "react";
import MealForm from "./MealForm";
import { deleteMeal } from "../catalog-actions";

interface Meal {
  id: string;
  title: string;
  description: string;
  calories: number;
  protein: number;
  fat: number;
  netCarbs: number;
  category: string;
  ingredients: unknown; // string[] at runtime
  instructions: unknown; // string[] at runtime
}

interface MealsManagerProps {
  meals: Meal[];
}

export default function MealsManager({ meals }: MealsManagerProps) {
  const [view, setView] = useState<"LIST" | "ADD" | "EDIT">("LIST");
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleEditClick = (meal: Meal) => {
    setSelectedMeal(meal);
    setView("EDIT");
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm("Are you sure you want to delete this meal? This action cannot be undone.")) return;
    setLoadingId(id);
    try {
      await deleteMeal(id);
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
            MEALS CATALOG ({meals.length})
          </h2>
          <button
            onClick={() => setView("ADD")}
            className="btn-assault"
          >
            <span>+ PROVISION NEW MEAL</span>
          </button>
        </div>
      )}

      {view === "ADD" && (
        <div className="panel-aggressive">
          <h2 className="text-xl font-black italic tracking-tight text-brand-orange uppercase mb-6">
            PROVISION NEW BULLETPROOF MEAL
          </h2>
          <MealForm onCancel={() => setView("LIST")} />
        </div>
      )}

      {view === "EDIT" && selectedMeal && (
        <div className="panel-aggressive">
          <h2 className="text-xl font-black italic tracking-tight text-brand-orange uppercase mb-6">
            EDIT BULLETPROOF MEAL: {selectedMeal.title}
          </h2>
          <MealForm
            meal={{
              ...selectedMeal,
              ingredients: Array.isArray(selectedMeal.ingredients) ? selectedMeal.ingredients : [],
              instructions: Array.isArray(selectedMeal.instructions) ? selectedMeal.instructions : [],
            }}
            onCancel={() => {
              setView("LIST");
              setSelectedMeal(null);
            }}
          />
        </div>
      )}

      {view === "LIST" && (
        <div className="space-y-4">
          {meals.length === 0 ? (
            <p className="text-sm text-brand-text-muted font-bold uppercase tracking-wider">
              No meals currently found in database.
            </p>
          ) : (
            <div className="space-y-4">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className="panel-aggressive flex flex-col justify-between"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-brand-border/60 pb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-black tracking-widest bg-brand-orange text-black px-2 py-0.5 uppercase leading-none">
                          {meal.category}
                        </span>
                        <span className="text-[10px] font-extrabold text-brand-text-muted uppercase leading-none">
                          ID: {meal.id}
                        </span>
                      </div>

                      <h3 className="text-xl font-black italic tracking-tight text-brand-text uppercase mt-3">
                        {meal.title}
                      </h3>
                      <p className="text-xs text-brand-text-muted mt-1 uppercase font-bold max-w-2xl">
                        {meal.description}
                      </p>
                    </div>

                    {/* Macros readout */}
                    <div className="flex gap-1.5 bg-brand-bg border border-brand-border p-2">
                      <div className="text-center px-2 py-0.5">
                        <span className="block text-[7px] text-brand-text-muted font-extrabold uppercase">CAL</span>
                        <span className="block text-xs font-black text-brand-text">{meal.calories}</span>
                      </div>
                      <div className="text-center px-2 py-0.5 border-l border-brand-border">
                        <span className="block text-[7px] text-brand-text-muted font-extrabold uppercase">PRO</span>
                        <span className="block text-xs font-black text-brand-orange">{meal.protein}G</span>
                      </div>
                      <div className="text-center px-2 py-0.5 border-l border-brand-border">
                        <span className="block text-[7px] text-brand-text-muted font-extrabold uppercase">FAT</span>
                        <span className="block text-xs font-black text-brand-text">{meal.fat}G</span>
                      </div>
                      <div className="text-center px-2 py-0.5 border-l border-brand-border">
                        <span className="block text-[7px] text-brand-text-muted font-extrabold uppercase">NET</span>
                        <span className="block text-xs font-black text-brand-safe">{meal.netCarbs}G</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-2">
                    <button
                      onClick={() => handleEditClick(meal)}
                      className="text-[10px] font-black tracking-[0.15em] uppercase px-3 py-2 bg-brand-orange/10 text-brand-orange border border-brand-orange/20 hover:bg-brand-orange hover:text-black transition-colors cursor-pointer"
                    >
                      EDIT DETAILS
                    </button>
                    <button
                      disabled={loadingId === meal.id}
                      onClick={() => handleDeleteClick(meal.id)}
                      className="text-[10px] font-black tracking-[0.15em] uppercase px-3 py-2 bg-transparent text-brand-danger/60 border border-brand-danger/20 hover:border-brand-danger hover:text-black transition-colors cursor-pointer"
                    >
                      {loadingId === meal.id ? "DELETING..." : "DELETE"}
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
