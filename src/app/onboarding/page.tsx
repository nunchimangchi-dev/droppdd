import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PERSONA_OPTIONS, DEFAULT_PERSONA } from "@/lib/personas";
import { onboardUser } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  "invalid-values": "Check your entries - weights, age, and height must be valid positive numbers.",
};

const inputClass =
  "w-full bg-brand-bg border border-brand-border focus:border-brand-orange hover:border-brand-border-strong rounded-none px-4 py-3 text-sm text-brand-text placeholder-brand-text-muted/40 uppercase font-bold tracking-wider focus:outline-none focus:ring-0 transition-colors";
const selectClass =
  "w-full bg-brand-bg border border-brand-border focus:border-brand-orange hover:border-brand-border-strong rounded-none px-3 py-3 text-sm text-brand-text uppercase font-bold tracking-wider focus:outline-none focus:ring-0 transition-colors cursor-pointer";

export default async function OnboardingPage({
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
  if (!session?.user?.username) {
    redirect("/choose-username");
  }

  const userId = session.user.id;

  // If user already has progress data, do not show onboarding
  const progress = await prisma.progress.findFirst({
    where: { userId },
  });
  if (progress) {
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
          INITIALIZE <span className="text-brand-orange">PROTOCOL</span>
        </h1>
        <p className="text-brand-text-muted text-xs font-black tracking-[0.3em] uppercase mt-2 leading-none">
          WELCOME OPERATOR. ESTABLISH YOUR BASELINE AND TARGET GOAL.
        </p>
      </div>

      {error && (
        <div className="bg-brand-danger/10 border-2 border-brand-danger text-brand-danger text-xs font-black p-4 rounded-none uppercase tracking-wider flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <span>{ERROR_MESSAGES[error] ?? "Something went wrong."}</span>
        </div>
      )}

      {/* Onboarding form */}
      <div className="panel-aggressive relative">
        <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none opacity-[0.02] hazard-stripes" />
        <h2 className="text-lg font-black tracking-wider text-brand-text-muted uppercase mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-brand-orange block" />
          PHYSICAL TELEMETRY CONFIGURATION
        </h2>

        <div className="bg-brand-safe/5 border border-brand-safe/30 p-4 mb-6 text-[10px] text-brand-text-muted font-bold uppercase tracking-wide leading-relaxed">
          Your exact weight, age, and height are never shown to other users. The leaderboard only
          ever shows a relative % toward your own goal and your streak - never a raw number.
        </div>

        <form action={onboardUser} className="space-y-5">
          {/* Eating approach - drives only the daily "Eating" check-in
              prompt and an optional reminder. Not a diet the app enforces. */}
          <fieldset className="space-y-3 border border-brand-border p-4">
            <legend className="label-micro px-2">YOUR APPROACH</legend>
            <p className="text-[10px] text-brand-text-muted uppercase font-bold leading-relaxed">
              How you handle eating. This just tailors your daily check-in - pick the closest.
            </p>
            <div className="space-y-2">
              {PERSONA_OPTIONS.map((p) => (
                <label
                  key={p.value}
                  className="flex items-start gap-3 bg-brand-bg/50 border border-brand-border p-3 cursor-pointer hover:border-brand-border-strong has-[:checked]:border-brand-orange"
                >
                  <input
                    type="radio"
                    name="persona"
                    value={p.value}
                    required
                    defaultChecked={p.value === DEFAULT_PERSONA}
                    className="mt-0.5 w-4 h-4 bg-brand-bg border border-brand-border accent-brand-orange cursor-pointer flex-shrink-0"
                  />
                  <span>
                    <span className="block text-xs font-black text-brand-text uppercase">{p.label}</span>
                    <span className="block text-[10px] text-brand-text-muted font-bold uppercase tracking-wide mt-0.5">
                      {p.blurb}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <div>
              <label htmlFor="eatingTargetNote" className="block label-micro mb-1.5">
                YOUR TARGET <span className="text-brand-text-muted/40">(OPTIONAL)</span>
              </label>
              <input
                type="text"
                id="eatingTargetNote"
                name="eatingTargetNote"
                maxLength={120}
                placeholder="A reminder to yourself, e.g. 20g carbs, one meal 6-7pm"
                className={inputClass}
              />
              <p className="text-[10px] text-brand-text-muted mt-1 uppercase font-bold">
                Just shown back to you at check-in. Never tracked or enforced.
              </p>
            </div>
          </fieldset>

          <div>
            <label className="block label-micro mb-1.5">WEIGHT UNIT</label>
            <select name="weightUnit" required defaultValue="LBS" className={selectClass}>
              <option value="LBS">Pounds (lbs)</option>
              <option value="KG">Kilograms (kg)</option>
            </select>
            <p className="text-[10px] text-brand-text-muted mt-1 uppercase font-bold">
              Applies to all three mass fields below.
            </p>
          </div>

          <div>
            <label className="block label-micro mb-1.5">STARTING MASS</label>
            <input
              type="number"
              step="0.1"
              name="startWeight"
              required
              placeholder="e.g. 200"
              className={inputClass}
            />
            <p className="text-[10px] text-brand-text-muted mt-1 uppercase font-bold">Your weight at the beginning of this journey.</p>
          </div>

          <div>
            <label className="block label-micro mb-1.5">CURRENT MASS</label>
            <input
              type="number"
              step="0.1"
              name="currentWeight"
              required
              placeholder="e.g. 195"
              className={inputClass}
            />
            <p className="text-[10px] text-brand-text-muted mt-1 uppercase font-bold">Your weight today.</p>
          </div>

          <div>
            <label className="block label-micro mb-1.5">TARGET MASS</label>
            <input
              type="number"
              step="0.1"
              name="targetWeight"
              required
              placeholder="e.g. 180"
              className={inputClass}
            />
            <p className="text-[10px] text-brand-text-muted mt-1 uppercase font-bold">Your objective goal weight.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block label-micro mb-1.5">AGE</label>
              <input
                type="number"
                step="1"
                name="age"
                required
                min={13}
                max={120}
                placeholder="e.g. 32"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block label-micro mb-1.5">HEIGHT</label>
              <input
                type="number"
                step="0.1"
                name="height"
                required
                placeholder="e.g. 70"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block label-micro mb-1.5">HEIGHT UNIT</label>
            <select name="heightUnit" required defaultValue="IN" className={selectClass}>
              <option value="IN">Inches (in)</option>
              <option value="CM">Centimeters (cm)</option>
            </select>
          </div>

          <div>
            <label className="block label-micro mb-1.5">MEAL PREFERENCE</label>
            <select name="mealPreference" required defaultValue="NO_PREFERENCE" className={selectClass}>
              <option value="NO_PREFERENCE">No preference</option>
              <option value="CARNIVORE">Carnivore</option>
              <option value="VEGETARIAN">Vegetarian</option>
            </select>
            <p className="text-[10px] text-brand-text-muted mt-1 uppercase font-bold">
              Saved to your profile for future use.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="btn-assault w-full"
            >
              <span>ENGAGE PROTOCOL</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
