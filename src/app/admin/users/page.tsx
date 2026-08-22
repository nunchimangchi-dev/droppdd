import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "../actions";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/");
  }

  // Gate check
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    redirect("/");
  }

  // Load all registered users and their relation counts
  const users = await prisma.user.findMany({
    include: {
      wagers: true,
      progress: true,
      weightRecords: true,
    },
    orderBy: { email: "asc" },
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
          OPERATOR <span className="text-brand-orange">INTEL</span>
        </h1>
        <p className="text-brand-text-muted text-xs md:text-sm font-black tracking-[0.3em] uppercase mt-2 leading-none">
          TROUBLESHOOTING PORTAL. READ-ONLY USER DISCIPLINE READOUT.
        </p>
      </div>

      {/* Users list grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-black tracking-wider text-brand-text-muted uppercase mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-brand-orange block" />
          ACTIVE REGISTERED OPERATORS ({users.length})
        </h2>

        {users.length === 0 ? (
          <p className="text-sm text-brand-text-muted font-bold uppercase tracking-wider">
            No registered users are currently in the database.
          </p>
        ) : (
          <div className="space-y-3">
            {users.map((u) => {
              const hasProgress = u.progress.length > 0;
              const activeWagers = u.wagers.filter((w) => w.status === "ACTIVE").length;
              
              return (
                <div
                  key={u.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-brand-card border border-brand-border hover:border-brand-border-strong transition-all duration-200 gap-4"
                >
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-brand-text uppercase italic tracking-tight">
                      {u.email ?? "ANONYMOUS OPERATOR"}
                    </h4>
                    <p className="text-[10px] text-brand-text-muted font-bold uppercase tracking-wider">
                      NAME: {u.name ?? "NOT PROVIDED"} • ID: {u.id}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-xs font-bold uppercase">
                    {/* Wager Summary */}
                    <div className="text-left md:text-right">
                      <span className="block text-[8px] text-brand-text-muted font-extrabold tracking-widest">WAGERS</span>
                      <span className="block text-brand-text">
                        {activeWagers} ACTIVE <span className="text-brand-text-muted">/ {u.wagers.length} TOTAL</span>
                      </span>
                    </div>

                    {/* Progress Summary */}
                    <div className="text-left md:text-right">
                      <span className="block text-[8px] text-brand-text-muted font-extrabold tracking-widest">METRIC PROFILE</span>
                      <span className={hasProgress ? "text-brand-safe" : "text-brand-danger"}>
                        {hasProgress ? "INITIALIZED" : "EMPTY"}
                      </span>
                    </div>

                    {/* Weight Record Summary */}
                    <div className="text-left md:text-right">
                      <span className="block text-[8px] text-brand-text-muted font-extrabold tracking-widest">WEIGH-INS</span>
                      <span className="block text-brand-text">
                        {u.weightRecords.length} RECORDS
                      </span>
                    </div>

                    {/* View Details Link */}
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="text-[10px] font-black tracking-[0.15em] uppercase px-4 py-2.5 bg-brand-orange/10 text-brand-orange border border-brand-orange/20 hover:bg-brand-orange hover:text-black transition-colors"
                    >
                      VIEW USER INTEL
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
