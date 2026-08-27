import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "../admin/actions";
import { createBoardItem, updateBoardItemStatus, deleteBoardItem } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  "invalid-card": "Check the fields and try again.",
  "unauthorized": "Admin authorization required for that action.",
};

const SUCCESS_MESSAGES: Record<string, string> = {
  "added": "Card added to the board.",
  "moved": "Card moved.",
  "removed": "Card removed.",
};

const COLUMNS: { status: string; label: string }[] = [
  { status: "NEW", label: "NEW" },
  { status: "PLANNED", label: "PLANNED" },
  { status: "IN_PROGRESS", label: "IN PROGRESS" },
  { status: "DONE", label: "DONE" },
];

const TYPE_STYLES: Record<string, string> = {
  BUG: "bg-brand-danger/10 text-brand-danger border-brand-danger/20",
  FEATURE: "bg-brand-orange/10 text-brand-orange border-brand-orange/20",
  DISCOVERY: "bg-brand-safe/10 text-brand-safe border-brand-safe/20",
};

const TYPE_LABELS: Record<string, string> = {
  BUG: "BUG",
  FEATURE: "FEATURE REQUEST",
  DISCOVERY: "DISCOVERY",
};

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
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
  const { error, success } = await searchParams;

  const items = await prisma.boardItem.findMany({
    include: { createdBy: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative border-l-8 border-brand-orange pl-6 md:pl-8 py-4 bg-brand-card/40 backdrop-blur-sm border-r border-y border-brand-border">
        <h1 className="heading-mega">
          FEEDBACK <span className="text-brand-orange">BOARD</span>
        </h1>
        <p className="text-brand-text-muted text-xs md:text-sm font-black tracking-[0.3em] uppercase mt-2 leading-none">
          BUGS, FEATURE REQUESTS, AND IDEAS &mdash; SUBMITTED BY REAL OPERATORS
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
          <span>{SUCCESS_MESSAGES[success] ?? "Done."}</span>
        </div>
      )}

      {/* Submit a card - open to every signed-in operator */}
      <div className="panel-aggressive">
        <h2 className="text-sm font-black tracking-wider text-brand-text-muted uppercase mb-4 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-brand-orange block" />
          SUBMIT A CARD
        </h2>
        <form action={createBoardItem} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block label-micro mb-1.5">TYPE</label>
              <select
                name="type"
                required
                defaultValue="BUG"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange rounded-none px-3 py-3 text-sm text-brand-text uppercase font-bold tracking-wider focus:outline-none focus:ring-0"
              >
                <option value="BUG">BUG</option>
                <option value="FEATURE">FEATURE REQUEST</option>
                <option value="DISCOVERY">DISCOVERY</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block label-micro mb-1.5">TITLE</label>
              <input
                type="text"
                name="title"
                required
                maxLength={120}
                placeholder="Short summary"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange rounded-none px-4 py-3 text-sm text-brand-text placeholder-brand-text-muted/40 font-bold tracking-wide focus:outline-none focus:ring-0"
              />
            </div>
          </div>
          <div>
            <label className="block label-micro mb-1.5">DESCRIPTION</label>
            <textarea
              name="description"
              required
              maxLength={2000}
              rows={3}
              placeholder="What happened, what you'd want, or what you noticed"
              className="w-full bg-brand-bg border border-brand-border focus:border-brand-orange rounded-none px-4 py-3 text-sm text-brand-text placeholder-brand-text-muted/40 font-bold tracking-wide focus:outline-none focus:ring-0"
            />
          </div>
          <button type="submit" className="btn-assault">
            <span>ADD CARD</span>
          </button>
        </form>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colItems = items.filter((i) => i.status === col.status);
          return (
            <div key={col.status} className="space-y-3">
              <h3 className="text-xs font-black tracking-widest text-brand-text-muted uppercase flex items-center justify-between px-1">
                <span>{col.label}</span>
                <span className="text-brand-text-muted/50">{colItems.length}</span>
              </h3>

              <div className="space-y-3 min-h-[80px]">
                {colItems.length === 0 && (
                  <p className="text-[10px] text-brand-text-muted/50 font-bold uppercase tracking-wider px-1">
                    Nothing here yet
                  </p>
                )}
                {colItems.map((item) => (
                  <div key={item.id} className="bg-brand-card border border-brand-border p-4 space-y-2">
                    <span
                      className={`inline-block text-[8px] font-black tracking-widest px-2 py-0.5 uppercase border ${TYPE_STYLES[item.type]}`}
                    >
                      {TYPE_LABELS[item.type]}
                    </span>
                    <h4 className="text-sm font-black text-brand-text leading-snug">{item.title}</h4>
                    <p className="text-xs text-brand-text-muted leading-relaxed">{item.description}</p>
                    <p className="text-[9px] text-brand-text-muted/50 font-bold uppercase tracking-wider pt-1">
                      @{item.createdBy.username ?? "unknown"}
                    </p>

                    {isAdmin && (
                      <div className="pt-2 border-t border-brand-border/40 flex flex-wrap items-center gap-2">
                        <form action={updateBoardItemStatus} className="flex items-center gap-1.5">
                          <input type="hidden" name="id" value={item.id} />
                          <select
                            name="status"
                            defaultValue={item.status}
                            className="text-[9px] font-black uppercase tracking-wider bg-brand-bg border border-brand-border px-1.5 py-1 focus:outline-none"
                          >
                            {COLUMNS.map((c) => (
                              <option key={c.status} value={c.status}>{c.label}</option>
                            ))}
                          </select>
                          <button
                            type="submit"
                            className="text-[9px] font-black uppercase tracking-wider text-brand-orange hover:text-white transition-colors"
                          >
                            MOVE
                          </button>
                        </form>
                        <form action={deleteBoardItem}>
                          <input type="hidden" name="id" value={item.id} />
                          <button
                            type="submit"
                            className="text-[9px] font-black uppercase tracking-wider text-brand-danger/60 hover:text-brand-danger transition-colors"
                          >
                            REMOVE
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
