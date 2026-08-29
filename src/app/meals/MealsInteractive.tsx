"use client";

import { useState } from "react";
import { generateAiMeal, type GeneratedMealType } from "./actions";
import type { Meal } from "../../../generated/prisma/client";

export function MealsInteractive({ meals }: { meals: Meal[] }) {
  const [activeTab, setActiveTab] = useState<"pantry" | "macro">("pantry");
  const [pantryIngredients, setPantryIngredients] = useState("");

  // Default values for standard daily keto macros
  const [macroCalories, setMacroCalories] = useState<string>("1500");
  const [macroProtein, setMacroProtein] = useState<string>("120");
  const [macroFat, setMacroFat] = useState<string>("110");
  const [macroNetCarbs, setMacroNetCarbs] = useState<string>("10");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedMeal, setGeneratedMeal] = useState<GeneratedMealType | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setGeneratedMeal(null);

    let rawData;
    if (activeTab === "pantry") {
      rawData = {
        type: "pantry",
        ingredients: pantryIngredients,
      };
    } else {
      rawData = {
        type: "macro",
        calories: Number(macroCalories),
        protein: Number(macroProtein),
        fat: Number(macroFat),
        netCarbs: Number(macroNetCarbs),
      };
    }

    try {
      const response = await generateAiMeal(rawData);
      if (response.success && response.meal) {
        setGeneratedMeal(response.meal);
      } else {
        setError(response.error || "Generation failed with an unknown error.");
      }
    } catch (err: unknown) {
      console.error(err);
      setError("Failed to communicate with the server action. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* AI Output Zone - full page width, above the static catalog, since a
          freshly generated recipe is the most relevant thing on the page
          and was previously squeezed into the narrow AI-planner column. */}
      {(isLoading || error || generatedMeal) && (
        <div className="space-y-4">
          {isLoading && (
            <div className="panel-aggressive border-dashed border-brand-orange/30 bg-brand-orange/[0.02] space-y-6 animate-pulse">
              <div className="h-4 bg-brand-orange/20 w-1/4 rounded-none" />
              <div className="h-8 bg-brand-text-muted/10 w-3/4 rounded-none" />
              <div className="h-16 bg-brand-text-muted/5 w-full rounded-none" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-20 bg-brand-text-muted/5 rounded-none" />
                <div className="h-20 bg-brand-text-muted/5 rounded-none" />
              </div>
            </div>
          )}

          {error && (
            <div className="panel-aggressive border-brand-danger bg-brand-danger/5 space-y-2">
              <div className="flex items-center gap-2 text-brand-danger font-black text-xs uppercase tracking-wider">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                  />
                </svg>
                GENERATION THREAD INTERRUPTED
              </div>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                {error}
              </p>
              <p className="text-[9px] text-brand-text-muted/60 mt-1 uppercase tracking-widest">
                * The AI engine hit a snag - try again in a moment.
              </p>
            </div>
          )}

          {generatedMeal && (
            <>
              <h2 className="text-sm font-black tracking-widest text-brand-orange uppercase flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-brand-orange animate-ping rounded-full" />
                SYNTHESIZED ACTIVE PROTOCOL:
              </h2>

              <div className="panel-aggressive space-y-6 border-brand-orange/70 shadow-[0_0_15px_rgba(255,84,0,0.15)]">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-brand-border pb-4">
                  <div>
                    <span className="text-[10px] tracking-[0.2em] font-extrabold bg-brand-orange text-black px-2.5 py-0.5 rounded-none uppercase leading-none">
                      {generatedMeal.category}
                    </span>
                    <h3 className="text-2xl font-black tracking-tight mt-3 text-brand-text italic uppercase">
                      {generatedMeal.title}
                    </h3>
                    <p className="text-brand-text-muted text-sm mt-1 max-w-xl">
                      {generatedMeal.description}
                    </p>
                  </div>

                  {/* Macros Board */}
                  <div className="flex gap-2 bg-brand-bg/50 p-2 border border-brand-border flex-shrink-0">
                    <div className="text-center px-3 py-1">
                      <span className="block text-[8px] text-brand-text-muted font-extrabold uppercase tracking-widest">CALORIES</span>
                      <span className="block text-base font-black text-brand-text">{generatedMeal.calories}</span>
                    </div>
                    <div className="text-center px-3 py-1 border-l border-brand-border">
                      <span className="block text-[8px] text-brand-text-muted font-extrabold uppercase tracking-widest">PROTEIN</span>
                      <span className="block text-base font-black text-brand-orange">{generatedMeal.protein}g</span>
                    </div>
                    <div className="text-center px-3 py-1 border-l border-brand-border">
                      <span className="block text-[8px] text-brand-text-muted font-extrabold uppercase tracking-widest">FAT</span>
                      <span className="block text-base font-black text-brand-text">{generatedMeal.fat}g</span>
                    </div>
                    <div className="text-center px-3 py-1 border-l border-brand-border">
                      <span className="block text-[8px] text-brand-text-muted font-extrabold uppercase tracking-widest">CARBS</span>
                      <span className="block text-base font-black text-brand-safe">{generatedMeal.netCarbs}g</span>
                    </div>
                  </div>
                </div>

                {/* Ingredients & Instructions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Ingredients Column */}
                  <div className="md:col-span-2 space-y-3">
                    <h4 className="text-xs font-extrabold tracking-widest text-brand-text-muted uppercase">
                      🛒 ESSENTIAL ELEMENTS:
                    </h4>
                    <ul className="space-y-1.5">
                      {generatedMeal.ingredients.map((ing, idx) => (
                        <li key={idx} className="text-xs flex items-start gap-2 text-brand-text/90">
                          <span className="text-brand-orange font-black">•</span>
                          <span>{ing}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Instructions Column */}
                  <div className="md:col-span-3 space-y-3">
                    <h4 className="text-xs font-extrabold tracking-widest text-brand-text-muted uppercase">
                      🔪 PREPARATION PROTOCOL:
                    </h4>
                    <ol className="space-y-3">
                      {generatedMeal.instructions.map((inst, idx) => (
                        <li key={idx} className="text-xs flex gap-3 text-brand-text/90">
                          <span className="font-black text-brand-orange flex-shrink-0 bg-brand-orange/10 border border-brand-orange/25 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{inst}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                {/* Recommended Grocery Run */}
                {generatedMeal.groceryList && generatedMeal.groceryList.length > 0 && (
                  <div className="border-t border-brand-border/40 pt-4 space-y-3">
                    <h4 className="text-xs font-extrabold tracking-widest text-brand-orange uppercase">
                      ⚡ RECOMMENDED GROCERY RUN (BUY THESE):
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {generatedMeal.groceryList.map((item, idx) => (
                        <li key={idx} className="text-xs flex items-center gap-2 text-brand-text/85 bg-brand-orange/5 p-2 border border-brand-orange/10">
                          <span className="text-brand-orange font-black">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Real Meals List - Takes 2 Columns */}
        <div className="xl:col-span-2 space-y-8">
          <h2 className="text-lg font-black tracking-wider text-brand-text-muted uppercase">
            ESTABLISHED BULLETPROOF FEASTS:
          </h2>

          <div className="space-y-6">
            {meals.map((meal) => (
              <div
                key={meal.id}
                className="panel-aggressive space-y-6"
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-brand-border pb-4">
                  <div>
                    <span className="text-[10px] tracking-[0.2em] font-extrabold bg-brand-orange text-black px-2.5 py-0.5 rounded-none uppercase leading-none">
                      {meal.category}
                    </span>
                    <h3 className="text-2xl font-black tracking-tight mt-3 text-brand-text italic uppercase">
                      {meal.title}
                    </h3>
                    <p className="text-brand-text-muted text-sm mt-1 max-w-xl">
                      {meal.description}
                    </p>
                  </div>

                  {/* Macros Board */}
                  <div className="flex gap-2 bg-brand-bg/50 p-2 border border-brand-border flex-shrink-0">
                    <div className="text-center px-3 py-1">
                      <span className="block text-[8px] text-brand-text-muted font-extrabold uppercase tracking-widest">CALORIES</span>
                      <span className="block text-base font-black text-brand-text">{meal.calories}</span>
                    </div>
                    <div className="text-center px-3 py-1 border-l border-brand-border">
                      <span className="block text-[8px] text-brand-text-muted font-extrabold uppercase tracking-widest">PROTEIN</span>
                      <span className="block text-base font-black text-brand-orange">{meal.protein}g</span>
                    </div>
                    <div className="text-center px-3 py-1 border-l border-brand-border">
                      <span className="block text-[8px] text-brand-text-muted font-extrabold uppercase tracking-widest">FAT</span>
                      <span className="block text-base font-black text-brand-text">{meal.fat}g</span>
                    </div>
                    <div className="text-center px-3 py-1 border-l border-brand-border">
                      <span className="block text-[8px] text-brand-text-muted font-extrabold uppercase tracking-widest">CARBS</span>
                      <span className="block text-base font-black text-brand-safe">{meal.netCarbs}g</span>
                    </div>
                  </div>
                </div>

                {/* Ingredients & Instructions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Ingredients Column */}
                  <div className="md:col-span-2 space-y-3">
                    <h4 className="text-xs font-extrabold tracking-widest text-brand-text-muted uppercase">
                      🛒 ESSENTIAL ELEMENTS:
                    </h4>
                    <ul className="space-y-1.5">
                      {(meal.ingredients as string[]).map((ing) => (
                        <li key={ing} className="text-xs flex items-start gap-2 text-brand-text/90">
                          <span className="text-brand-orange font-black">•</span>
                          <span>{ing}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Instructions Column */}
                  <div className="md:col-span-3 space-y-3">
                    <h4 className="text-xs font-extrabold tracking-widest text-brand-text-muted uppercase">
                      🔪 PREPARATION PROTOCOL:
                    </h4>
                    <ol className="space-y-3">
                      {(meal.instructions as string[]).map((inst, idx) => (
                        <li key={idx} className="text-xs flex gap-3 text-brand-text/90">
                          <span className="font-black text-brand-orange flex-shrink-0 bg-brand-orange/10 border border-brand-orange/25 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{inst}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI MEAL PLANNING - form only, result renders in the full-width
            zone above rather than in this narrow column */}
        <div className="space-y-6">
          <h2 className="text-lg font-black tracking-wider text-brand-text-muted uppercase">
            AI TACTICAL NUTRITION:
          </h2>

          <div className="panel-aggressive border-brand-orange/45 space-y-6 overflow-visible">
            {/* Background accent */}
            <div className="absolute -right-16 -bottom-16 w-48 h-48 rounded-full bg-brand-orange/5 blur-3xl pointer-events-none" />

            {/* Tactical Header */}
            <div className="inline-flex items-center gap-1.5 text-[10px] bg-brand-orange text-black font-black px-2.5 py-1.5 uppercase tracking-widest rounded-none leading-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-3.5 h-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904 9 21l8.982-11.795h-5.282L14.75 3l-8.981 11.795h5.283Z"
                />
              </svg>
              AI MEAL ENGINE v2.0
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black italic tracking-tight text-brand-text uppercase">
                AI COGNITIVE MEAL PLANNER
              </h3>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                Generate instant tactical nutrition. Synthesize high-octane low-carb feasts from what&apos;s on hand or based on strict macro target configurations.
              </p>
            </div>

            {/* Dual Entry Point Tab Selector */}
            <div className="flex border border-brand-border bg-brand-bg/50">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("pantry");
                  setError(null);
                }}
                disabled={isLoading}
                className={`flex-1 py-2.5 text-[10px] font-black tracking-widest uppercase transition-all duration-150 ${
                  activeTab === "pantry"
                    ? "bg-brand-orange text-black"
                    : "text-brand-text-muted hover:text-brand-text hover:bg-brand-card-hover disabled:opacity-50"
                }`}
              >
                🛒 Kitchen Sink (Pantry-Driven)
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("macro");
                  setError(null);
                }}
                disabled={isLoading}
                className={`flex-1 py-2.5 text-[10px] font-black tracking-widest uppercase transition-all duration-150 border-l border-brand-border ${
                  activeTab === "macro"
                    ? "bg-brand-orange text-black"
                    : "text-brand-text-muted hover:text-brand-text hover:bg-brand-card-hover disabled:opacity-50"
                }`}
              >
                🎯 Let&apos;s Go Shopping (Macro-Driven)
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === "pantry" ? (
                <div className="space-y-2">
                  <label className="block label-micro">
                    AVAILABLE PANTRY INGREDIENTS
                  </label>
                  <textarea
                    required
                    disabled={isLoading}
                    rows={4}
                    value={pantryIngredients}
                    onChange={(e) => setPantryIngredients(e.target.value)}
                    placeholder="List ingredients you have on hand (e.g. ribeye steak, bacon, eggs, cheddar cheese, spinach, avocado, butter, olive oil...)"
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange px-4 py-2.5 text-xs font-bold tracking-wider text-brand-text placeholder-brand-text-muted/40 focus:outline-none uppercase disabled:opacity-50 min-h-[100px]"
                  />
                  <p className="text-[10px] text-brand-text-muted leading-relaxed">
                    * The system will formulate a keto feast prioritizing these ingredients.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block label-micro mb-1">
                        TARGET CALORIES (KCAL)
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        disabled={isLoading}
                        value={macroCalories}
                        onChange={(e) => setMacroCalories(e.target.value)}
                        className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange px-3 py-2 text-xs font-bold tracking-wider uppercase text-brand-text focus:outline-none disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block label-micro mb-1">
                        NET CARBS (G)
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        disabled={isLoading}
                        value={macroNetCarbs}
                        onChange={(e) => setMacroNetCarbs(e.target.value)}
                        className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange px-3 py-2 text-xs font-bold tracking-wider uppercase text-brand-text focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block label-micro mb-1">
                        PROTEIN (G)
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        disabled={isLoading}
                        value={macroProtein}
                        onChange={(e) => setMacroProtein(e.target.value)}
                        className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange px-3 py-2 text-xs font-bold tracking-wider uppercase text-brand-text focus:outline-none disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block label-micro mb-1">
                        FAT (G)
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        disabled={isLoading}
                        value={macroFat}
                        onChange={(e) => setMacroFat(e.target.value)}
                        className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange px-3 py-2 text-xs font-bold tracking-wider uppercase text-brand-text focus:outline-none disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-brand-text-muted leading-relaxed">
                    * The system will generate a matching recipe and formulate a recommended grocery list.
                  </p>
                </div>
              )}

              {/* Action Trigger Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full font-black text-xs tracking-widest py-3 uppercase transition-all duration-200 border cursor-pointer ${
                  isLoading
                    ? "bg-brand-orange/20 border-brand-orange/30 text-brand-orange animate-pulse cursor-not-allowed"
                    : "bg-brand-orange text-black border-brand-orange hover:bg-white hover:border-white"
                }`}
              >
                {isLoading ? "COMPUTING FUEL PROTOCOL..." : "GENERATE PROTOCOL FEAST"}
              </button>
            </form>

            {/* Technical Notice */}
            <div className="text-[10px] text-brand-text-muted italic text-center">
              * Real cognitive inference. Generated protocols are ephemeral and not saved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
