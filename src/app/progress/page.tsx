import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function ProgressPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const progress = await prisma.progress.findFirst({
    where: { userId: session.user.id },
  });
  const weightHistory = await prisma.weightRecord.findMany({
    where: { userId: session.user.id },
    orderBy: { id: 'asc' },
  });

  if (!progress) {
    return <div className="text-center py-16">No progress data found.</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-l-4 border-orange-500 pl-4 md:pl-6 py-2">
        <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-zinc-900 dark:text-zinc-50">
          PHYSICAL DATA
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base font-black tracking-widest uppercase mt-1">
          TRACK YOUR ANNIHILATION OF EXCESS MASS.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "CURRENT", value: `${progress.currentWeight} LBS` },
          { label: "START", value: `${progress.startWeight} LBS` },
          { label: "TARGET", value: `${progress.targetWeight} LBS` },
          { label: "STREAK", value: `${progress.currentStreak} DAYS` },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-4 rounded-sm">
            <p className="text-[10px] text-zinc-500 font-black tracking-widest uppercase">{stat.label}</p>
            <p className="text-xl font-black text-zinc-900 dark:text-zinc-50 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Static Visualization */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 p-6 rounded-sm">
        <h2 className="text-lg font-black tracking-wider text-zinc-400 uppercase mb-6">WEIGHT LOSS TREND</h2>
        
        <div className="space-y-4">
          {weightHistory.map((record) => {
            const percentage = ( (progress.startWeight - record.weight) / (progress.startWeight - progress.targetWeight) ) * 100;
            
            return (
              <div key={record.date} className="flex items-center gap-4">
                <span className="text-xs font-black text-zinc-500 w-16 uppercase">{record.date}</span>
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-900 h-6 rounded-sm overflow-hidden flex items-center">
                  <div 
                    className="h-full bg-orange-500/80 transition-all duration-500" 
                    style={{ width: `${Math.max(percentage, 5)}%` }} 
                  />
                </div>
                <span className="text-xs font-black text-zinc-900 dark:text-zinc-50 w-20 text-right">{record.weight} LBS</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
