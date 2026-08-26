import { signIn } from "@/auth";

export default function SignInPage() {
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-brand-bg overflow-hidden">
      {/* Aggressive Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(45deg, #ff5400 25%, transparent 25%, transparent 50%, #ff5400 50%, #ff5400 75%, transparent 75%, transparent)`,
          backgroundSize: '100px 100px'
        }}
      />
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-orange to-transparent opacity-50" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-orange to-transparent opacity-50" />

      <div className="relative w-full max-w-lg px-6">
        {/* Shadow/Glow effect */}
        <div className="absolute -inset-1 bg-brand-orange/10 blur-2xl rounded-full pointer-events-none" />

        <div className="relative bg-brand-card border-2 border-brand-border p-10 text-center space-y-8 shadow-[20px_20px_0px_0px_rgba(0,0,0,1),21px_21px_0px_0px_rgba(34,34,38,1)]">
          <div className="space-y-2">
            <span className="font-black tracking-[0.25em] text-5xl text-brand-orange italic block transform -skew-x-6">
              DROPPDD<span className="text-brand-text">.</span>
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="h-[1px] w-8 bg-brand-border" />
              <span className="text-[10px] tracking-[0.4em] font-black text-brand-text-muted uppercase">
                EST. 2026
              </span>
              <span className="h-[1px] w-8 bg-brand-border" />
            </div>
          </div>

          <p className="text-xs text-brand-text-muted font-bold uppercase tracking-wide leading-relaxed max-w-sm mx-auto">
            A small, invite-only beta for keto/OMAD training: guided workouts,
            AI-generated meal plans, weight &amp; streak tracking, and
            accountability wagers against yourself or a friend.
          </p>

          <div className="grid grid-cols-2 gap-3 text-left max-w-sm mx-auto">
            {[
              ["WORKOUTS", "Guided keto/OMAD training programs"],
              ["AI MEALS", "Pantry or macro-driven recipe generation"],
              ["WAGERS", "Solo or peer accountability, honor system"],
              ["LEADERBOARD", "Relative progress only, never raw numbers"],
            ].map(([label, desc]) => (
              <div key={label} className="border border-brand-border p-3">
                <p className="text-[9px] font-black text-brand-orange uppercase tracking-wider">{label}</p>
                <p className="text-[9px] text-brand-text-muted font-bold uppercase tracking-wide mt-1 leading-tight">{desc}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <h1 className="text-xl font-black text-brand-text uppercase tracking-tighter italic">
              OPERATIONAL ACCESS REQUIRED
            </h1>
            <p className="text-[10px] text-brand-text-muted font-extrabold uppercase tracking-[0.2em] leading-relaxed max-w-[240px] mx-auto">
              AUTHENTICATE TO COMMENCE DAILY ASSAULT AND TRACK CONDITIONING
            </p>
          </div>

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
            className="pt-4"
          >
            <button
              type="submit"
              className="btn-assault w-full py-5 cursor-pointer"
            >
              <span>SIGN IN WITH GOOGLE</span>
            </button>
          </form>

          <div className="pt-4 space-y-3">
            <p className="text-[9px] text-brand-text-muted/60 font-black tracking-widest uppercase">
              NO EXCUSES. NO WEAKNESS. ONLY RESULTS.
            </p>
            <div className="flex items-center justify-center gap-3 text-[9px] font-black uppercase tracking-widest">
              <a href="/legal/privacy" className="text-brand-text-muted/60 hover:text-brand-orange transition-colors">
                Privacy Policy
              </a>
              <span className="text-brand-text-muted/30">&middot;</span>
              <a href="/legal/terms" className="text-brand-text-muted/60 hover:text-brand-orange transition-colors">
                Beta Terms
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
