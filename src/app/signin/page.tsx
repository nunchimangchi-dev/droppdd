import { signIn } from "@/auth";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-sm p-8 text-center space-y-6">
        <div>
          <span className="font-black tracking-widest text-3xl text-orange-500 italic block">
            DROPPDD<span className="text-zinc-900 dark:text-zinc-50">.</span>
          </span>
          <span className="text-[10px] tracking-[0.2em] font-extrabold text-zinc-500 block mt-1 uppercase">
            AGGRESSIVE ATHLETICISM
          </span>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-extrabold uppercase tracking-wider">
          Sign in to continue
        </p>

        <form
          action={async () => {
            "use server";
            await signIn("google");
          }}
        >
          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black text-sm tracking-widest uppercase py-3.5 rounded-sm transition-colors"
          >
            Sign in with Google
          </button>
        </form>
      </div>
    </div>
  );
}
