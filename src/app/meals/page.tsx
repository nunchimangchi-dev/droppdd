import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MealsInteractive } from "./MealsInteractive";

export default async function MealsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  if (!session?.user?.termsAcceptedAt) {
    redirect("/welcome");
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

      <MealsInteractive meals={meals} />
    </div>
  );
}
