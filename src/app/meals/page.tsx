import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AiMealPlanner } from "./AiMealPlanner";

export default async function MealsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  if (!session?.user?.username) {
    redirect("/choose-username");
  }

  const meals = await prisma.meal.findMany();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Section Header */}
      <div className="relative border-l-8 border-brand-orange pl-6 md:pl-8 py-4 bg-brand-card/40 backdrop-blur-sm border-r border-y border-brand-border shadow-[20px_20px_40px_-20px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0H100V10H0V0ZM0 20H100V30H0V20ZM0 40H100V50H0V40ZM0 60H100V70H0V60ZM0 80H100V90H0V80Z" fill="currentColor" className="text-brand-orange" />
          </svg>
        </div>
        <h1 className="heading-mega">
          NUTRITION <span className="text-brand-orange">SYSTEM</span>
        </h1>
        <p className="text-brand-text-muted text-xs md:text-sm font-black tracking-[0.3em] uppercase mt-2 leading-none">
          KETO-OMAD PROTOCOLS. INGEST <span className="text-brand-text">FUEL</span>, NOT REFINED TRASH.
        </p>
      </div>

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

        {/* AI MEAL PLANNING */}
        <div className="space-y-6">
          <h2 className="text-lg font-black tracking-wider text-brand-text-muted uppercase">
            AI TACTICAL NUTRITION:
          </h2>

          <AiMealPlanner />
        </div>
      </div>
    </div>
  );
}
