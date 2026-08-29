import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function AttackPage() {
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

  const strengthProtocol = await prisma.workout.findFirst({
    include: { exercises: true },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Aggressive Section Header */}
      <div className="relative border-l-8 border-brand-orange pl-6 md:pl-8 py-4 bg-brand-card/40 backdrop-blur-sm border-r border-y border-brand-border shadow-[20px_20px_40px_-20px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0H100V10H0V0ZM0 20H100V30H0V20ZM0 40H100V50H0V40ZM0 60H100V70H0V60ZM0 80H100V90H0V80Z" fill="currentColor" className="text-brand-orange" />
          </svg>
        </div>
        <h1 className="heading-mega">
          THE <span className="text-brand-orange">ATTACK</span>
        </h1>
        <p className="text-brand-text-muted text-xs md:text-sm font-black tracking-[0.3em] uppercase mt-2 leading-none">
          THE STANDING PRESCRIPTION. NO GYM MEMBERSHIP REQUIRED.
        </p>
      </div>

      <p className="text-brand-text-muted text-sm max-w-2xl">
        This is the standard you&apos;re checking in against every day - reference it here, then log
        what you actually did on{" "}
        <Link href="/checkin" className="text-brand-orange hover:text-white transition-colors font-bold">
          Check-In
        </Link>
        .
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strength Protocol - DB-backed, editable via /admin/workouts */}
        <div className="panel-aggressive space-y-5">
          <div>
            <span className="text-[10px] tracking-[0.2em] font-extrabold bg-brand-orange text-black px-2.5 py-0.5 rounded-none uppercase leading-none">
              STRENGTH PROTOCOL
            </span>
            {strengthProtocol && (
              <p className="text-brand-text-muted/80 text-sm mt-3 leading-relaxed">
                {strengthProtocol.description}
              </p>
            )}
          </div>

          {strengthProtocol ? (
            <div className="space-y-2">
              {strengthProtocol.exercises.map((ex) => (
                <div
                  key={ex.id}
                  className="flex justify-between items-center bg-brand-bg/40 p-3 border border-brand-border"
                >
                  <span className="text-xs font-black text-brand-text uppercase">{ex.name}</span>
                  <span className="text-xs font-bold text-brand-text-muted uppercase">
                    {ex.sets} × {ex.reps}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-brand-text-muted font-bold uppercase">
              No strength protocol configured yet.
            </p>
          )}

          <p className="text-[10px] text-brand-text-muted uppercase font-bold tracking-wide border-t border-brand-border pt-4">
            Complete any 3 of the above to go green on Strength during Check-In.
          </p>
        </div>

        {/* Movement Protocol - static guideline, not exercise-shaped data */}
        <div className="panel-aggressive space-y-5">
          <div>
            <span className="text-[10px] tracking-[0.2em] font-extrabold bg-brand-orange text-black px-2.5 py-0.5 rounded-none uppercase leading-none">
              MOVEMENT PROTOCOL
            </span>
            <p className="text-brand-text-muted/80 text-sm mt-3 leading-relaxed">
              Consistency over intensity. Get your body moving every day - the specific activity
              matters far less than actually doing it.
            </p>
          </div>

          <div className="bg-brand-bg/40 p-4 border border-brand-border space-y-1">
            <p className="text-xs font-black text-brand-orange uppercase">10,000+ steps a day</p>
            <p className="text-[10px] text-brand-text-muted font-bold uppercase tracking-wide">
              The single most important number on this page.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-extrabold tracking-wider text-brand-text-muted uppercase">
              ANY OF THESE COUNT:
            </p>
            <div className="flex flex-wrap gap-2">
              {["Walking", "Jogging / Running", "Swimming", "Cycling"].map((activity) => (
                <span
                  key={activity}
                  className="text-[10px] font-bold uppercase px-2.5 py-1.5 bg-brand-bg/40 border border-brand-border text-brand-text/90"
                >
                  {activity}
                </span>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-brand-text-muted uppercase font-bold tracking-wide border-t border-brand-border pt-4">
            Go green on Movement during Check-In once you&apos;ve hit it.
          </p>
        </div>
      </div>
    </div>
  );
}
