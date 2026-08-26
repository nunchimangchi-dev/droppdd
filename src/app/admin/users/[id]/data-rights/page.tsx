import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "../../../actions";
import { deleteUserData } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  "confirmation-mismatch": "The typed callsign/email didn't match exactly. Nothing was deleted.",
  "not-acknowledged": "You must confirm the export checkbox before deleting.",
  "not-found": "User not found - they may have already been deleted.",
};

export default async function DataRightsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
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

  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    redirect("/");
  }

  const { id } = await params;
  const { error } = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      progress: true,
      weightRecords: true,
      wagers: true,
      wagersChallenged: true,
    },
  });

  if (!user) {
    notFound();
  }

  const activeChallenges = user.wagersChallenged.filter((w) => w.status === "ACTIVE" || w.status === "PENDING");

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      <div>
        <Link
          href={`/admin/users/${id}`}
          className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-brand-text-muted hover:text-brand-orange transition-colors uppercase"
        >
          ← BACK TO OPERATOR SECURITY BRIEF
        </Link>
      </div>

      <div className="relative border-l-8 border-brand-danger pl-6 md:pl-8 py-4 bg-brand-card/40 backdrop-blur-sm border-r border-y border-brand-border shadow-[20px_20px_40px_-20px_rgba(0,0,0,0.5)]">
        <h1 className="heading-mega">
          DATA RIGHTS <span className="text-brand-danger">REQUEST</span>
        </h1>
        <p className="text-brand-text-muted text-xs md:text-sm font-black tracking-[0.3em] uppercase mt-2 leading-none">
          FOR @{user.username ?? user.email ?? user.id} - ONLY USE AFTER VERIFYING THIS REQUEST IS REALLY THEM.
        </p>
      </div>

      {error && (
        <div className="bg-brand-danger/10 border-2 border-brand-danger text-brand-danger text-xs font-black p-4 rounded-none uppercase tracking-wider flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <span>{ERROR_MESSAGES[error] ?? "Something went wrong."}</span>
        </div>
      )}

      {/* Step 1: Export */}
      <div className="panel-aggressive">
        <h2 className="text-sm font-black tracking-wider text-brand-text-muted uppercase mb-4 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-brand-orange block" />
          STEP 1 — EXPORT THEIR DATA
        </h2>
        <p className="text-xs text-brand-text-muted font-bold uppercase tracking-wide mb-4">
          Fulfills the Right to Access/Portability. Do this even for an erasure-only request - send
          them the file before anything is deleted.
        </p>
        <a
          href={`/admin/users/${id}/export`}
          download
          className="btn-assault inline-flex items-center justify-center w-full sm:w-auto"
        >
          <span>DOWNLOAD DATA EXPORT (JSON)</span>
        </a>
      </div>

      {/* Consequence preview */}
      <div className="panel-aggressive">
        <h2 className="text-sm font-black tracking-wider text-brand-text-muted uppercase mb-4 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-brand-orange block" />
          WHAT DELETION WOULD REMOVE
        </h2>
        <ul className="space-y-2 text-xs text-brand-text font-bold uppercase tracking-wide">
          <li>• {user.progress.length} progress record(s)</li>
          <li>• {user.weightRecords.length} weigh-in(s)</li>
          <li>• {user.wagers.length} wager(s) they created</li>
          <li>• {user.wagersChallenged.length} wager(s) where they were challenged</li>
        </ul>
        {activeChallenges.length > 0 && (
          <div className="bg-brand-warning/10 border-2 border-brand-warning text-brand-warning text-xs font-black p-4 rounded-none uppercase tracking-wider mt-4">
            ⚠️ {activeChallenges.length} of those are ACTIVE or PENDING challenges from other
            operators - deleting this user removes their side of it too, silently disappearing from
            the challenger&apos;s history. This is expected for a real erasure request, but confirm
            it&apos;s actually intended.
          </div>
        )}
      </div>

      {/* Step 2: Confirm and delete */}
      <div className="panel-aggressive border-brand-danger/50">
        <h2 className="text-sm font-black tracking-wider text-brand-danger uppercase mb-4 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-brand-danger block" />
          STEP 2 — PERMANENTLY DELETE
        </h2>

        <form action={deleteUserData} className="space-y-5">
          <input type="hidden" name="userId" value={user.id} />

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="exportAcknowledged"
              required
              className="mt-1 w-4 h-4 accent-brand-danger cursor-pointer"
            />
            <span className="text-[11px] font-bold text-brand-text uppercase tracking-wide leading-relaxed">
              I have exported this user&apos;s data (or they explicitly declined it) and verified
              this deletion request is really them.
            </span>
          </label>

          <div>
            <label className="block label-micro mb-1.5">
              TYPE THEIR EXACT CALLSIGN TO CONFIRM: <span className="text-brand-orange">{user.username ?? user.email}</span>
            </label>
            <input
              type="text"
              name="confirmation"
              required
              placeholder="type exactly as shown above"
              className="w-full bg-brand-bg border border-brand-danger/40 focus:border-brand-danger rounded-none px-4 py-3 text-sm text-brand-text placeholder-brand-text-muted/40 uppercase font-bold tracking-wider focus:outline-none focus:ring-0 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 text-xs font-black uppercase tracking-wider bg-brand-danger text-black hover:bg-red-400 transition-colors"
          >
            PERMANENTLY DELETE ALL DATA
          </button>
        </form>
      </div>
    </div>
  );
}
