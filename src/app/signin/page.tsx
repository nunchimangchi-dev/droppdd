import { signIn } from "@/auth";

export default function SignInPage() {
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-black overflow-hidden">
      {/* Aggressive Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(45deg, #f97316 25%, transparent 25%, transparent 50%, #f97316 50%, #f97316 75%, transparent 75%, transparent)`,
          backgroundSize: '100px 100px'
        }}
      />
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50" />

      <div className="relative w-full max-w-md px-6">
        {/* Shadow/Glow effect */}
        <div className="absolute -inset-1 bg-orange-500/10 blur-2xl rounded-full pointer-events-none" />
        
        <div className="relative bg-zinc-950 border-2 border-zinc-900 p-10 text-center space-y-8 shadow-[20px_20px_0px_0px_rgba(0,0,0,1),21px_21px_0px_0px_rgba(39,39,42,1)]">
          <div className="space-y-2">
            <span className="font-black tracking-[0.25em] text-5xl text-orange-500 italic block transform -skew-x-6">
              DROPPDD<span className="text-zinc-50">.</span>
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="h-[1px] w-8 bg-zinc-800" />
              <span className="text-[10px] tracking-[0.4em] font-black text-zinc-500 uppercase">
                EST. 2026
              </span>
              <span className="h-[1px] w-8 bg-zinc-800" />
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-xl font-black text-zinc-100 uppercase tracking-tighter">
              OPERATIONAL ACCESS REQUIRED
            </h1>
            <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-[0.2em] leading-relaxed max-w-[240px] mx-auto">
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
              className="group relative w-full bg-orange-500 hover:bg-orange-600 text-black font-black text-sm tracking-[0.2em] uppercase py-5 transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none overflow-hidden"
            >
              <span className="relative z-10">Sign in with Google</span>
              <div className="absolute inset-0 bg-white/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
            </button>
          </form>

          <div className="pt-4">
            <p className="text-[9px] text-zinc-700 font-black tracking-widest uppercase">
              NO EXCUSES. NO WEAKNESS. ONLY RESULTS.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
