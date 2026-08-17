import { prisma } from "@/lib/prisma";

export default async function MealsPage() {
  const meals = await prisma.meal.findMany();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Section Header */}
      <div className="border-l-4 border-orange-500 pl-4 md:pl-6 py-2">
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-zinc-900 dark:text-zinc-50">
          NUTRITION SYSTEM
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-black tracking-widest uppercase mt-1">
          KETO-OMAD PROTOCOLS. INGEST FUEL, NOT REFINED TRASH.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Real Meals List - Takes 2 Columns */}
        <div className="xl:col-span-2 space-y-8">
          <h2 className="text-lg font-black tracking-wider text-zinc-400 uppercase">
            ESTABLISHED BULLETPROOF FEASTS:
          </h2>

          <div className="space-y-6">
            {meals.map((meal) => (
              <div
                key={meal.id}
                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-sm space-y-6"
              >
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-150 dark:border-zinc-900 pb-4">
                  <div>
                    <span className="text-[10px] tracking-[0.2em] font-extrabold bg-orange-500 text-black px-2 py-0.5 rounded-none uppercase">
                      {meal.category}
                    </span>
                    <h3 className="text-2xl font-black tracking-tight mt-2 text-zinc-900 dark:text-zinc-50 italic">
                      {meal.title}
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1 max-w-xl">
                      {meal.description}
                    </p>
                  </div>

                  {/* Macros Board */}
                  <div className="flex gap-2 bg-zinc-50 dark:bg-zinc-900/40 p-2 border border-zinc-200 dark:border-zinc-900 flex-shrink-0">
                    <div className="text-center px-2.5">
                      <span className="block text-[8px] text-zinc-400 font-extrabold uppercase">CALORIES</span>
                      <span className="block text-base font-black text-zinc-900 dark:text-zinc-50">{meal.calories}</span>
                    </div>
                    <div className="text-center px-2.5 border-l border-zinc-200 dark:border-zinc-800">
                      <span className="block text-[8px] text-zinc-400 font-extrabold uppercase">PROTEIN</span>
                      <span className="block text-base font-black text-orange-500">{meal.protein}g</span>
                    </div>
                    <div className="text-center px-2.5 border-l border-zinc-200 dark:border-zinc-800">
                      <span className="block text-[8px] text-zinc-400 font-extrabold uppercase">FAT</span>
                      <span className="block text-base font-black text-zinc-900 dark:text-zinc-50">{meal.fat}g</span>
                    </div>
                    <div className="text-center px-2.5 border-l border-zinc-200 dark:border-zinc-800">
                      <span className="block text-[8px] text-zinc-400 font-extrabold uppercase">CARBS</span>
                      <span className="block text-base font-black text-green-500">{meal.netCarbs}g</span>
                    </div>
                  </div>
                </div>

                {/* Ingredients & Instructions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Ingredients Column */}
                  <div className="md:col-span-2 space-y-3">
                    <h4 className="text-xs font-extrabold tracking-widest text-zinc-400 uppercase">
                      🛒 ESSENTIAL ELEMENTS:
                    </h4>
                    <ul className="space-y-1.5">
                      {(meal.ingredients as string[]).map((ing) => (
                        <li key={ing} className="text-xs flex items-start gap-2 text-zinc-700 dark:text-zinc-300">
                          <span className="text-orange-500 font-black">•</span>
                          <span>{ing}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Instructions Column */}
                  <div className="md:col-span-3 space-y-3">
                    <h4 className="text-xs font-extrabold tracking-widest text-zinc-400 uppercase">
                      🔪 PREPARATION PROTOCOL:
                    </h4>
                    <ol className="space-y-3">
                      {(meal.instructions as string[]).map((inst, idx) => (
                        <li key={idx} className="text-xs flex gap-3 text-zinc-700 dark:text-zinc-300">
                          <span className="font-black text-orange-500 flex-shrink-0 bg-orange-500/10 border border-orange-500/20 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
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

        {/* AI MEAL PLANNING - COMING SOON SECTION */}
        <div className="space-y-6">
          <h2 className="text-lg font-black tracking-wider text-zinc-400 uppercase">
            AI TACTICAL NUTRITION:
          </h2>

          <div className="bg-zinc-950 text-zinc-100 border-2 border-dashed border-zinc-800 p-6 md:p-8 rounded-sm space-y-6 relative overflow-hidden">
            {/* Background accent */}
            <div className="absolute -right-16 -bottom-16 w-48 h-48 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />

            {/* Coming Soon Flag */}
            <div className="inline-flex items-center gap-1.5 text-[10px] bg-orange-500 text-black font-black px-2.5 py-1 uppercase tracking-widest rounded-none">
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
              AI MEAL PROTOCOL — COMING SOON
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black italic tracking-tight text-zinc-100">
                AI COGNITIVE MEAL PLANNER
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Unlock instant nutrition configuration. Our coming-soon deep network matches your active macros, daily workout exhaustion level, and grocery availability to spin up highly tailored keto feasts in 3 seconds.
              </p>
            </div>

            {/* MOCK GENERATOR UI */}
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-sm space-y-4">
              <p className="text-[9px] font-extrabold tracking-widest text-zinc-500 uppercase">
                COGNITIVE PARAMS (PREVIEW ONLY)
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-black text-zinc-400 uppercase mb-1">
                    TARGET CALORIC MASS
                  </label>
                  <select disabled className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs text-zinc-600 rounded-none font-bold uppercase cursor-not-allowed">
                    <option>1,200 - 1,500 KCAL (OMAD FEAST)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-zinc-400 uppercase mb-1">
                    DIETARY PROTOCOL
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="border border-orange-500/30 bg-orange-500/5 text-orange-500 text-[10px] p-2 font-black uppercase text-center cursor-not-allowed">
                      STRICT KETO
                    </div>
                    <div className="border border-zinc-800 text-zinc-600 text-[10px] p-2 font-black uppercase text-center cursor-not-allowed">
                      CARB CYCLING
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-zinc-400 uppercase mb-1">
                    PRIMARY PROTEIN FOCUS
                  </label>
                  <select disabled className="w-full bg-zinc-950 border border-zinc-800 p-2 text-xs text-zinc-600 rounded-none font-bold uppercase cursor-not-allowed">
                    <option>BEEF & COLDWATER FISH</option>
                  </select>
                </div>
              </div>

              <button
                disabled
                className="w-full bg-orange-500/10 border border-orange-500/20 text-orange-500/40 font-black text-xs tracking-widest py-3 uppercase cursor-not-allowed mt-2"
              >
                GENERATE PROTOCOL FEAST
              </button>
            </div>

            <div className="text-[10px] text-zinc-500 italic text-center">
              * Active development is underway. Real intelligence engine will deploy soon.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
