import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateUsername } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  "missing": "Username is required.",
  "invalid-format": "3-20 characters, alphanumeric & underscores only (no spaces).",
  "taken": "That username is already taken. Choose another.",
};

const SUCCESS_MESSAGES: Record<string, string> = {
  "true": "Callsign updated successfully.",
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }
  if (!session?.user?.username) {
    redirect("/choose-username");
  }

  const userId = session.user.id;
  const { error, success } = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, name: true, email: true },
  });

  if (!user) {
    redirect("/signin");
  }

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
          OPERATOR <span className="text-brand-orange">PROFILE</span>
        </h1>
        <p className="text-brand-text-muted text-xs font-black tracking-[0.3em] uppercase mt-2 leading-none">
          MANAGE YOUR IDENTIFICATION PARAMETERS AND PROTOCOLS.
        </p>
      </div>

      {error && (
        <div className="bg-brand-danger/10 border-2 border-brand-danger text-brand-danger text-xs font-black p-4 rounded-none uppercase tracking-wider flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <span>{ERROR_MESSAGES[error] ?? "Something went wrong."}</span>
        </div>
      )}

      {success && (
        <div className="bg-brand-safe/10 border-2 border-brand-safe text-brand-safe text-xs font-black p-4 rounded-none uppercase tracking-wider flex items-center gap-3">
          <span className="text-xl">✅</span>
          <span>{SUCCESS_MESSAGES[success] ?? "Action successful."}</span>
        </div>
      )}

      {/* Operator Details */}
      <div className="panel-aggressive">
        <h2 className="text-sm font-black tracking-wider text-brand-text-muted uppercase mb-4 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-brand-orange block" />
          TELEMETRY CREDENTIALS
        </h2>
        <div className="space-y-3 text-xs uppercase font-bold tracking-wider">
          <div className="flex justify-between border-b border-brand-border py-2">
            <span className="text-brand-text-muted">NAME</span>
            <span className="text-brand-text">{user.name || "UNSPECIFIED"}</span>
          </div>
          <div className="flex justify-between border-b border-brand-border py-2">
            <span className="text-brand-text-muted">SECURE EMAIL</span>
            <span className="text-brand-text truncate max-w-xs">{user.email || "UNSPECIFIED"}</span>
          </div>
        </div>
      </div>

      {/* Change Username Form */}
      <div className="panel-aggressive relative">
        <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-[0.02] hazard-stripes" />
        <h2 className="text-sm font-black tracking-wider text-brand-text-muted uppercase mb-6 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-brand-orange block" />
          MODIFY IDENTIFICATION CALLSIGN
        </h2>

        <form action={updateUsername} className="space-y-5">
          <div>
            <label className="block label-micro mb-1.5">
              CURRENT CALLSIGN: <span className="text-brand-orange">{user.username}</span>
            </label>
            <input
              type="text"
              name="username"
              required
              minLength={3}
              maxLength={20}
              defaultValue={user.username || ""}
              placeholder="e.g. hunter_99"
              className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange hover:border-brand-border-strong rounded-none px-4 py-3 text-sm text-brand-text placeholder-brand-text-muted/40 uppercase font-bold tracking-wider focus:outline-none focus:ring-0 transition-colors"
            />
            <p className="text-[10px] text-brand-text-muted mt-2 uppercase font-bold">
              3-20 characters, alphanumeric and underscore only. Changes take effect immediately.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="btn-assault w-full"
            >
              <span>COMMIT CHANGE</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
