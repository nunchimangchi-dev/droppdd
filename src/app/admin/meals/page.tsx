import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "../actions";
import MealsManager from "./MealsManager";

const ERROR_MESSAGES: Record<string, string> = {
  "unauthorized": "Access denied. Admin authorization required.",
  "invalid-data": "Please correct the form errors and try again.",
  "meal-not-found": "The requested meal was not found.",
};

const SUCCESS_MESSAGES: Record<string, string> = {
  "created": "Meal successfully provisioned in catalog.",
  "updated": "Meal successfully updated.",
  "deleted": "Meal successfully deleted from catalog.",
};

export default async function AdminMealsPage({
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

  // Gate check
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    redirect("/");
  }

  const { error, success } = await searchParams;

  // Load all meals
  const meals = await prisma.meal.findMany({
    orderBy: { id: "asc" },
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Aggressive Header */}
      <div className="relative border-l-8 border-brand-orange pl-6 md:pl-8 py-4 bg-brand-card/40 backdrop-blur-sm border-r border-y border-brand-border shadow-[20px_20px_40px_-20px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 0H100V10H0V0ZM0 20H100V30H0V20ZM0 40H100V50H0V40ZM0 60H100V70H0V60ZM0 80H100V90H0V80Z" fill="currentColor" className="text-brand-orange" />
          </svg>
        </div>
        <h1 className="heading-mega">
          MEALS <span className="text-brand-orange">CATALOG</span>
        </h1>
        <p className="text-brand-text-muted text-xs md:text-sm font-black tracking-[0.3em] uppercase mt-2 leading-none">
          GLOBAL MANAGEMENT OF PROTOCOL MEALS.
        </p>
      </div>

      {error && (
        <div className="bg-brand-danger/10 border-2 border-brand-danger text-brand-danger text-xs font-black p-4 rounded-none uppercase tracking-wider flex items-center gap-3 animate-pulse">
          <span className="text-xl">⚠️</span>
          <span>{ERROR_MESSAGES[error] ?? "Something went wrong."}</span>
        </div>
      )}

      {success && (
        <div className="bg-brand-safe/10 border-2 border-brand-safe text-brand-safe text-xs font-black p-4 rounded-none uppercase tracking-wider flex items-center gap-3">
          <span className="text-xl">✅</span>
          <span>{SUCCESS_MESSAGES[success] ?? "Operation completed successfully."}</span>
        </div>
      )}

      <MealsManager meals={meals} />
    </div>
  );
}
