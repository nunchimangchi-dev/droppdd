import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { addAllowedEmail, toggleAdminStatus, removeAllowedEmail } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  "unauthorized": "Access denied. Admin authorization required.",
  "invalid-email": "Please enter a valid email address.",
  "email-exists": "This email address is already on the allowlist.",
  "last-admin": "Cannot remove or demote the last administrator. At least one admin is required.",
  "email-not-found": "Specified email address was not found.",
};

const SUCCESS_MESSAGES: Record<string, string> = {
  "added": "Email address successfully added to allowlist.",
  "removed": "Email address successfully removed from allowlist.",
  "toggled": "Admin status successfully updated.",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/");
  }

  // Load the AllowedEmail row for the current logged-in user
  const currentUserAllowed = await prisma.allowedEmail.findUnique({
    where: { email: session.user.email },
  });

  // Gated route: must be an admin to access this page
  if (!currentUserAllowed?.isAdmin) {
    redirect("/");
  }

  const { error, success } = await searchParams;
  const currentUserEmail = session.user.email;

  // Retrieve all operators on the allowlist, sorted by id
  const allowedEmails = await prisma.allowedEmail.findMany({
    orderBy: { id: "asc" },
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
          ALLOWLIST <span className="text-brand-orange">&</span> ADMIN
        </h1>
        <p className="text-brand-text-muted text-xs md:text-sm font-black tracking-[0.3em] uppercase mt-2 leading-none">
          MANAGE OPERATORS AND ACCESS. DEFENSE IN DEPTH.
        </p>
      </div>

      {/* Alert Banner for errors */}
      {error && (
        <div className="bg-brand-danger/10 border-2 border-brand-danger text-brand-danger text-xs font-black p-4 rounded-none uppercase tracking-wider flex items-center gap-3 animate-pulse">
          <span className="text-xl">⚠️</span>
          <span>{ERROR_MESSAGES[error] ?? "Something went wrong."}</span>
        </div>
      )}

      {/* Alert Banner for success */}
      {success && (
        <div className="bg-brand-safe/10 border-2 border-brand-safe text-brand-safe text-xs font-black p-4 rounded-none uppercase tracking-wider flex items-center gap-3">
          <span className="text-xl">✅</span>
          <span>{SUCCESS_MESSAGES[success] ?? "Operation completed successfully."}</span>
        </div>
      )}

      {/* Admin Quick Portal Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/admin/workouts" className="panel-aggressive hover:border-brand-orange/60 group block">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-black tracking-widest bg-brand-orange/15 border border-brand-orange/20 text-brand-orange px-2 py-0.5 uppercase">
              CATALOG
            </span>
          </div>
          <h3 className="text-lg font-black italic text-brand-text group-hover:text-brand-orange transition-colors uppercase mt-4">
            WORKOUTS
          </h3>
          <p className="text-xs text-brand-text-muted mt-1 uppercase font-bold leading-normal">
            PROVISION, UPDATE, AND PRUNE GLOBAL TRAINING RUNS.
          </p>
        </Link>

        <Link href="/admin/meals" className="panel-aggressive hover:border-brand-orange/60 group block">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-black tracking-widest bg-brand-orange/15 border border-brand-orange/20 text-brand-orange px-2 py-0.5 uppercase">
              CATALOG
            </span>
          </div>
          <h3 className="text-lg font-black italic text-brand-text group-hover:text-brand-orange transition-colors uppercase mt-4">
            MEALS
          </h3>
          <p className="text-xs text-brand-text-muted mt-1 uppercase font-bold leading-normal">
            PROVISION, UPDATE, AND PRUNE GLOBAL PROTOCOL FEASTS.
          </p>
        </Link>

        <Link href="/admin/users" className="panel-aggressive hover:border-brand-orange/60 group block">
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-black tracking-widest bg-brand-orange/15 border border-brand-orange/20 text-brand-orange px-2 py-0.5 uppercase">
              SECURITY
            </span>
          </div>
          <h3 className="text-lg font-black italic text-brand-text group-hover:text-brand-orange transition-colors uppercase mt-4">
            OPERATOR INTEL
          </h3>
          <p className="text-xs text-brand-text-muted mt-1 uppercase font-bold leading-normal">
            AUDIT AND TROUBLESHOOT REGISTERED OPERATOR DISCIPLINE LOGS.
          </p>
        </Link>
      </div>

      {/* Operator creation form */}
      <div className="panel-aggressive relative">
        <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-[0.02] hazard-stripes" />
        <h2 className="text-lg font-black tracking-wider text-brand-text-muted uppercase mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-brand-orange block" />
          PROVISION NEW OPERATOR
        </h2>

        <form action={addAllowedEmail} className="space-y-5">
          <div>
            <label className="block label-micro mb-1.5">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="operator@example.com"
              className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange hover:border-brand-border-strong rounded-none px-4 py-3 text-sm text-brand-text placeholder-brand-text-muted/40 uppercase font-bold tracking-wider focus:outline-none focus:ring-0 transition-colors"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isAdmin"
              name="isAdmin"
              className="w-4 h-4 bg-brand-bg border border-brand-border text-brand-orange focus:ring-brand-orange rounded-none accent-brand-orange cursor-pointer"
            />
            <label htmlFor="isAdmin" className="text-xs font-black tracking-wider text-brand-text uppercase cursor-pointer select-none">
              GRANT ADMINISTRATOR PRIVILEGES (isAdmin)
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="btn-assault w-full md:w-auto"
            >
              <span>AUTHORIZE OPERATOR</span>
            </button>
          </div>
        </form>
      </div>

      {/* List of authorized operators */}
      <div className="space-y-4">
        <h2 className="text-lg font-black tracking-wider text-brand-text-muted uppercase mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-brand-orange block" />
          AUTHORIZED OPERATORS ({allowedEmails.length})
        </h2>

        <div className="space-y-3">
          {allowedEmails.map((allowed) => {
            const isCurrentUser = allowed.email === currentUserEmail;

            return (
              <div
                key={allowed.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-brand-card border border-brand-border hover:border-brand-border-strong transition-all duration-200"
              >
                <div className="space-y-1 mb-3 sm:mb-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-black text-brand-text uppercase italic tracking-tight truncate max-w-xs md:max-w-md">
                      {allowed.email}
                    </h4>
                    {isCurrentUser && (
                      <span className="text-[8px] font-black tracking-widest bg-brand-orange/10 text-brand-orange border border-brand-orange/20 px-1.5 py-0.5 uppercase leading-none">
                        YOU
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-brand-text-muted font-bold uppercase tracking-wider">
                    OPERATOR ID: #{allowed.id}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Toggle Admin Status Form */}
                  <form action={toggleAdminStatus}>
                    <input type="hidden" name="email" value={allowed.email} />
                    <button
                      type="submit"
                      title={allowed.isAdmin ? "Demote from Admin" : "Promote to Admin"}
                      className={`text-[10px] font-black tracking-[0.15em] uppercase px-3 py-2 rounded-none border transition-colors cursor-pointer ${
                        allowed.isAdmin
                          ? "bg-brand-orange/10 text-brand-orange border-brand-orange/20 hover:bg-brand-orange hover:text-black"
                          : "bg-transparent text-brand-text-muted border-brand-border hover:border-brand-border-strong hover:text-brand-text"
                      }`}
                    >
                      {allowed.isAdmin ? "ADMIN" : "MEMBER"}
                    </button>
                  </form>

                  {/* Remove Operator Form */}
                  <form action={removeAllowedEmail}>
                    <input type="hidden" name="email" value={allowed.email} />
                    <button
                      type="submit"
                      className="text-[10px] font-black tracking-[0.15em] uppercase px-3 py-2 bg-transparent text-brand-danger/60 border border-brand-danger/20 hover:border-brand-danger hover:text-black transition-colors cursor-pointer"
                    >
                      REVOKE ACCESS
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
