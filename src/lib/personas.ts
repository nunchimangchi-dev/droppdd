// The user's eating method, chosen at onboarding and editable in profile.
// It drives ONLY the "Eating" check-in prompt and an optional self-set
// target reminder. The streak math (three booleans: strength, movement,
// eating) is identical for every persona. No enforcement, no
// number-logging - "did you hit your target today?" stays a 10-second
// self-report, same as it always was. This is what keeps droppdd from
// turning into a food diary.

export const EATING_PERSONAS = ["KETO", "OMAD", "CALORIE", "KETO_OMAD"] as const;
export type EatingPersona = (typeof EATING_PERSONAS)[number];

// Existing users (and anyone who skips the question) land here - it's the
// original "OMAD + keto" assumption the app shipped with.
export const DEFAULT_PERSONA: EatingPersona = "KETO_OMAD";

interface PersonaMeta {
  value: EatingPersona;
  label: string; // short name for selectors
  blurb: string; // one line under the onboarding radio option
  checkPrompt: string; // the daily "Eating" checkbox text
  targetPlaceholder: string; // hint for the optional target-note field
}

export const PERSONA_META: Record<EatingPersona, PersonaMeta> = {
  KETO: {
    value: "KETO",
    label: "Keto",
    blurb: "Low-carb. You keep net carbs under a ceiling.",
    checkPrompt: "Stayed under my carb ceiling today",
    targetPlaceholder: "e.g. 20g net carbs or less",
  },
  OMAD: {
    value: "OMAD",
    label: "OMAD",
    blurb: "One meal a day, inside a set eating window.",
    checkPrompt: "Ate within my eating window today",
    targetPlaceholder: "e.g. one meal, 6-7pm",
  },
  CALORIE: {
    value: "CALORIE",
    label: "Calorie / macros",
    blurb: "You track intake against a daily target.",
    checkPrompt: "Hit my calorie / macro target today",
    targetPlaceholder: "e.g. 1,800 kcal, 150g protein",
  },
  KETO_OMAD: {
    value: "KETO_OMAD",
    label: "Keto + OMAD",
    blurb: "Both - low-carb, inside one window. The fastest cut.",
    checkPrompt: "Stayed low-carb and inside my window today",
    targetPlaceholder: "e.g. 20g carbs, one meal 6-7pm",
  },
};

export function personaMeta(p: string | null | undefined): PersonaMeta {
  return PERSONA_META[p as EatingPersona] ?? PERSONA_META[DEFAULT_PERSONA];
}

// Onboarding / profile selector order - hero cut last so it reads as the
// "and if you want to go all in" option rather than the default ask.
export const PERSONA_OPTIONS: PersonaMeta[] = [
  PERSONA_META.OMAD,
  PERSONA_META.KETO,
  PERSONA_META.CALORIE,
  PERSONA_META.KETO_OMAD,
];
