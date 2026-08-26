import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { chooseUsername } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  "missing": "Username is required.",
  "invalid-format": "3-20 characters, alphanumeric & underscores only (no spaces).",
  "taken": "That username is already taken. Choose another.",
};

export default async function ChooseUsernamePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  if (!session?.user?.termsAcceptedAt) {
    redirect("/welcome");
  }

  // If user already has a username, do not show this page
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  });
  if (user?.username) {
    redirect("/");
  }

  const { error } = await searchParams;

  return (
    <div className="space-y-8 animate-fade-in max-w-xl mx-auto">
      {/* Aggressive Section Header */}
      <div className="relative border-l-8 border-brand-orange pl-6 md:pl-8 py-4 bg-brand-card/40 backdrop-blur-sm border-r border-y border-brand-border shadow-[20px_20px_40px_-20px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0H100V10H0V0ZM0 20H100V30H0V20ZM0 40H100V50H0V40ZM0 60H100V70H0V60ZM0 80H100V90H0V80Z" fill="currentColor" className="text-brand-orange" />
          </svg>
        </div>
        <h1 className="heading-mega">
          ESTABLISH <span className="text-brand-orange">CALLSIGN</span>
        </h1>
        <p className="text-brand-text-muted text-xs font-black tracking-[0.3em] uppercase mt-2 leading-none">
          CHOOSE A UNIQUE USERNAME. NO SPACES. ALPHANUMERIC & UNDERSCORE ONLY.
        </p>
      </div>

      {error && (
        <div className="bg-brand-danger/10 border-2 border-brand-danger text-brand-danger text-xs font-black p-4 rounded-none uppercase tracking-wider flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <span>{ERROR_MESSAGES[error] ?? "Something went wrong."}</span>
        </div>
      )}

      {/* Username selection form */}
      <div className="panel-aggressive relative">
        <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-[0.02] hazard-stripes" />
        <h2 className="text-lg font-black tracking-wider text-brand-text-muted uppercase mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-brand-orange block" />
          IDENTIFICATION TELEMETRY
        </h2>

        <form action={chooseUsername} className="space-y-5">
          <div>
            <label className="block label-micro mb-1.5">
              CHOSEN USERNAME
            </label>
            <input
              type="text"
              name="username"
              required
              minLength={3}
              maxLength={20}
              placeholder="e.g. hunter_99"
              className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange hover:border-brand-border-strong rounded-none px-4 py-3 text-sm text-brand-text placeholder-brand-text-muted/40 uppercase font-bold tracking-wider focus:outline-none focus:ring-0 transition-colors"
            />
            <p className="text-[10px] text-brand-text-muted mt-1 uppercase font-bold">
              Casing will be preserved for display. Comparisons are case-insensitive.
            </p>
            <p className="text-[10px] text-brand-orange mt-2 uppercase font-bold">
              Visible to every other beta operator on the leaderboard and in wager challenges - choose accordingly.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="btn-assault w-full"
            >
              <span>LOCK CALLSIGN</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
