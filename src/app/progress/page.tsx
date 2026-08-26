import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeGoalPercent } from "@/lib/progress-percent";

export default async function ProgressPage() {
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

  const progress = await prisma.progress.findFirst({
    where: { userId: session.user.id },
  });

  if (!progress) {
    redirect("/onboarding");
  }

  const weightHistory = await prisma.weightRecord.findMany({
    where: { userId: session.user.id },
    orderBy: { recordedAt: 'asc' },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="relative border-l-8 border-brand-orange pl-6 md:pl-8 py-4 bg-brand-card/40 backdrop-blur-sm border-r border-y border-brand-border shadow-[20px_20px_40px_-20px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0H100V10H0V0ZM0 20H100V30H0V20ZM0 40H100V50H0V40ZM0 60H100V70H0V60ZM0 80H100V90H0V80Z" fill="currentColor" className="text-brand-orange" />
          </svg>
        </div>
        <h1 className="heading-mega">
          PHYSICAL <span className="text-brand-orange">DATA</span>
        </h1>
        <p className="text-brand-text-muted text-xs md:text-sm font-black tracking-[0.3em] uppercase mt-2 leading-none">
          TRACK YOUR ANNIHILATION OF EXCESS MASS. NO WEIGHT TO WASTE.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "CURRENT MASS", value: `${progress.currentWeight} LBS`, highlight: true },
          { label: "STARTING MASS", value: `${progress.startWeight} LBS`, highlight: false },
          { label: "TARGET MASS", value: `${progress.targetWeight} LBS`, highlight: false },
          { label: "STREAK COUNT", value: `${progress.currentStreak} DAYS`, highlight: false },
        ].map((stat) => (
          <div key={stat.label} className="panel-aggressive">
            <p className="label-micro mb-2">{stat.label}</p>
            <p className={`text-2xl font-black italic uppercase ${stat.highlight ? "text-brand-orange" : "text-brand-text"}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Static Visualization */}
      <div className="panel-aggressive">
        <h2 className="text-lg font-black tracking-wider text-brand-text-muted uppercase mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-brand-orange block" />
          WEIGHT LOSS TREND / EXTERMINATION PATHWAY
        </h2>
        
        <div className="space-y-4">
          {weightHistory.map((record) => {
            const boundedPercent = computeGoalPercent(progress.startWeight, record.weight, progress.targetWeight);

            return (
              <div key={record.date} className="flex items-center gap-4">
                <span className="text-xs font-black text-brand-text-muted w-16 uppercase leading-none">{record.date}</span>
                <div className="flex-1 bg-brand-bg h-6 rounded-none border border-brand-border overflow-hidden flex items-center">
                  <div 
                    className="h-full bg-brand-orange/80 hover:bg-brand-orange transition-all duration-500 relative" 
                    style={{ width: `${boundedPercent}%` }} 
                  >
                    {/* Subtle micro stripe reflection on progress bars */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.1] hazard-stripes" />
                  </div>
                </div>
                <span className="text-xs font-black text-brand-text w-20 text-right leading-none">{record.weight} LBS</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
