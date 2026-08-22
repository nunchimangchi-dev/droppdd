"use client";

import { useState } from "react";
import { createMeal, updateMeal } from "../catalog-actions";

interface MealFormProps {
  meal?: {
    id: string;
    title: string;
    description: string;
    calories: number;
    protein: number;
    fat: number;
    netCarbs: number;
    category: string;
    ingredients: string[];
    instructions: string[];
  };
  onCancel: () => void;
}

export default function MealForm({ meal, onCancel }: MealFormProps) {
  const [title, setTitle] = useState(meal?.title ?? "");
  const [description, setDescription] = useState(meal?.description ?? "");
  const [calories, setCalories] = useState(meal?.calories ?? 0);
  const [protein, setProtein] = useState(meal?.protein ?? 0);
  const [fat, setFat] = useState(meal?.fat ?? 0);
  const [netCarbs, setNetCarbs] = useState(meal?.netCarbs ?? 0);
  const [category, setCategory] = useState(meal?.category ?? "OMAD FEAST");

  const [ingredients, setIngredients] = useState<string[]>(
    meal?.ingredients ?? [""]
  );
  const [instructions, setInstructions] = useState<string[]>(
    meal?.instructions ?? [""]
  );

  const [loading, setLoading] = useState(false);

  // Dynamic lists handlers for Ingredients
  const handleAddIngredient = () => {
    setIngredients([...ingredients, ""]);
  };
  const handleRemoveIngredient = (index: number) => {
    if (ingredients.length === 1) return;
    setIngredients(ingredients.filter((_, i) => i !== index));
  };
  const handleIngredientChange = (index: number, value: string) => {
    const updated = [...ingredients];
    updated[index] = value;
    setIngredients(updated);
  };

  // Dynamic lists handlers for Instructions
  const handleAddInstruction = () => {
    setInstructions([...instructions, ""]);
  };
  const handleRemoveInstruction = (index: number) => {
    if (instructions.length === 1) return;
    setInstructions(instructions.filter((_, i) => i !== index));
  };
  const handleInstructionChange = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      title,
      description,
      calories,
      protein,
      fat,
      netCarbs,
      category,
      ingredients: ingredients.filter(Boolean),
      instructions: instructions.filter(Boolean),
    };

    try {
      if (meal) {
        await updateMeal(meal.id, payload);
      } else {
        await createMeal(payload);
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
          <label className="block label-micro mb-1.5">Meal Title</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Ribeye OMAD Feast"
            className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange px-4 py-2.5 text-sm font-bold tracking-wider uppercase text-brand-text placeholder-brand-text-muted/40 focus:outline-none"
          />
        </div>

        <div>
          <label className="block label-micro mb-1.5">Category Protocol</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange px-4 py-2.5 text-sm font-bold tracking-wider uppercase text-brand-text focus:outline-none cursor-pointer"
          >
            <option value="OMAD FEAST">OMAD FEAST</option>
            <option value="KETO POWER">KETO POWER</option>
            <option value="REFUEL">REFUEL</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block label-micro mb-1.5">Protocol Description</label>
        <textarea
          required
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Nutrient-dense powerhouse meal designed to supply sustained lipids and clean proteins..."
          className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange px-4 py-2.5 text-sm font-bold tracking-wider text-brand-text placeholder-brand-text-muted/40 focus:outline-none uppercase"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <label className="block label-micro mb-1.5">Calories (Kcal)</label>
          <input
            type="number"
            required
            min={0}
            value={calories}
            onChange={(e) => setCalories(Number(e.target.value))}
            className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange px-4 py-2.5 text-sm font-bold tracking-wider uppercase text-brand-text focus:outline-none"
          />
        </div>

        <div>
          <label className="block label-micro mb-1.5">Protein (g)</label>
          <input
            type="number"
            required
            min={0}
            value={protein}
            onChange={(e) => setProtein(Number(e.target.value))}
            className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange px-4 py-2.5 text-sm font-bold tracking-wider uppercase text-brand-text focus:outline-none"
          />
        </div>

        <div>
          <label className="block label-micro mb-1.5">Fat (g)</label>
          <input
            type="number"
            required
            min={0}
            value={fat}
            onChange={(e) => setFat(Number(e.target.value))}
            className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange px-4 py-2.5 text-sm font-bold tracking-wider uppercase text-brand-text focus:outline-none"
          />
        </div>

        <div>
          <label className="block label-micro mb-1.5">Net Carbs (g)</label>
          <input
            type="number"
            required
            min={0}
            value={netCarbs}
            onChange={(e) => setNetCarbs(Number(e.target.value))}
            className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange px-4 py-2.5 text-sm font-bold tracking-wider uppercase text-brand-text focus:outline-none"
          />
        </div>
      </div>

      {/* Dynamic Ingredients & Instructions side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-brand-border">
        {/* Ingredients repeatable section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black tracking-widest text-brand-text-muted uppercase italic">
              🛒 ESSENTIAL ELEMENTS ({ingredients.length})
            </h3>
            <button
              type="button"
              onClick={handleAddIngredient}
              className="text-[9px] font-black tracking-widest uppercase bg-brand-orange/10 border border-brand-orange/20 text-brand-orange px-2 py-1 hover:bg-brand-orange hover:text-black transition-colors"
            >
              + ADD INGREDIENT
            </button>
          </div>

          <div className="space-y-2">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  required
                  value={ing}
                  onChange={(e) => handleIngredientChange(idx, e.target.value)}
                  placeholder={`e.g. ${idx === 0 ? "16oz Grass-fed Ribeye" : "Next Element"}`}
                  className="flex-1 bg-brand-bg border border-brand-border focus:border-brand-orange px-3 py-2 text-xs font-bold uppercase text-brand-text placeholder-brand-text-muted/30 focus:outline-none"
                />
                {ingredients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(idx)}
                    className="text-xs font-black text-brand-danger hover:text-white px-2 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Instructions repeatable section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black tracking-widest text-brand-text-muted uppercase italic">
              🔪 PREPARATION PROTOCOL ({instructions.length})
            </h3>
            <button
              type="button"
              onClick={handleAddInstruction}
              className="text-[9px] font-black tracking-widest uppercase bg-brand-orange/10 border border-brand-orange/20 text-brand-orange px-2 py-1 hover:bg-brand-orange hover:text-black transition-colors"
            >
              + ADD STEP
            </button>
          </div>

          <div className="space-y-2">
            {instructions.map((inst, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <span className="font-black text-brand-orange flex-shrink-0 bg-brand-orange/10 border border-brand-orange/25 w-6 h-6 rounded-full flex items-center justify-center text-[10px] mt-1">
                  {idx + 1}
                </span>
                <textarea
                  required
                  rows={1}
                  value={inst}
                  onChange={(e) => handleInstructionChange(idx, e.target.value)}
                  placeholder={`e.g. ${idx === 0 ? "Sear steak in hot cast-iron..." : "Next Step"}`}
                  className="flex-1 bg-brand-bg border border-brand-border focus:border-brand-orange px-3 py-2 text-xs font-bold uppercase text-brand-text placeholder-brand-text-muted/30 focus:outline-none"
                />
                {instructions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveInstruction(idx)}
                    className="text-xs font-black text-brand-danger hover:text-white px-2 mt-1 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-4 border-t border-brand-border">
        <button
          type="submit"
          disabled={loading}
          className="btn-assault"
        >
          <span>{loading ? "SUBMITTING..." : meal ? "LOCK IN CHANGES" : "PROVISION MEAL"}</span>
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
