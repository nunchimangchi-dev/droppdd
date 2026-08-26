import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { acceptTerms } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  "must-agree": "You need to check the box to continue.",
};

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { termsAcceptedAt: true },
  });
  if (user?.termsAcceptedAt) {
    redirect("/choose-username");
  }

  const { error } = await searchParams;

  return (
    <div className="space-y-8 animate-fade-in max-w-xl mx-auto">
      <div className="relative border-l-8 border-brand-orange pl-6 md:pl-8 py-4 bg-brand-card/40 backdrop-blur-sm border-r border-y border-brand-border shadow-[20px_20px_40px_-20px_rgba(0,0,0,0.5)]">
        <h1 className="heading-mega">
          BEFORE YOU <span className="text-brand-orange">ENLIST</span>
        </h1>
        <p className="text-brand-text-muted text-xs font-black tracking-[0.3em] uppercase mt-2 leading-none">
          droppdd IS A SMALL BETA. QUICK READ BEFORE WE START TRACKING YOUR DATA.
        </p>
      </div>

      {error && (
        <div className="bg-brand-danger/10 border-2 border-brand-danger text-brand-danger text-xs font-black p-4 rounded-none uppercase tracking-wider flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <span>{ERROR_MESSAGES[error] ?? "Something went wrong."}</span>
        </div>
      )}

      <div className="panel-aggressive space-y-4">
        <ul className="space-y-3 text-xs text-brand-text-muted font-bold uppercase tracking-wide leading-relaxed">
          <li>&bull; You&apos;ll pick a username - visible to other beta users on the leaderboard and in wager challenges.</li>
          <li>&bull; You&apos;ll enter body data (weight, age, height) - your exact numbers are never shown to anyone else, only a relative % of progress.</li>
          <li>&bull; Wagers are honor-system only - no real money moves through the app.</li>
          <li>&bull; This isn&apos;t medical advice - talk to a doctor before starting any new fitness or diet protocol.</li>
        </ul>

        <div className="flex gap-4 pt-2 text-[10px] font-black uppercase tracking-widest">
          <Link href="/legal/privacy" className="text-brand-orange hover:underline" target="_blank">
            Full Privacy Policy
          </Link>
          <Link href="/legal/terms" className="text-brand-orange hover:underline" target="_blank">
            Full Beta Terms
          </Link>
        </div>

        <form action={acceptTerms} className="pt-4 border-t border-brand-border space-y-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="agree"
              required
              className="mt-1 w-4 h-4 accent-brand-orange cursor-pointer"
            />
            <span className="text-[11px] font-bold text-brand-text uppercase tracking-wide leading-relaxed">
              I&apos;ve read the Privacy Policy and Beta Terms and agree to them.
            </span>
          </label>

          <button type="submit" className="btn-assault w-full py-4">
            <span>ACCEPT &amp; CONTINUE</span>
          </button>
        </form>
      </div>
    </div>
  );
}
