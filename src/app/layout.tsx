import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DROPPDD // Aggressive Fitness & Fasting",
  description: "High-intensity keto guided workouts, aggressive OMAD tracking, and raw athletic conditioning. No soft wellness. Pure action.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();

  let isAdmin = false;
  if (session?.user?.email) {
    const allowed = await prisma.allowedEmail.findUnique({
      where: { email: session.user.email },
    });
    isAdmin = allowed?.isAdmin === true;
  }

  const signOutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/signin" });
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans flex flex-col md:flex-row">
        <Navbar userEmail={session?.user?.email ?? null} signOutAction={signOutAction} isAdmin={isAdmin} />
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile Header */}
          <header className="md:hidden flex items-center justify-between p-4 border-b border-zinc-900 bg-zinc-950 sticky top-0 z-40 shadow-xl">
            <div className="flex flex-col">
              <span className="font-black tracking-widest text-xl text-orange-500 italic leading-none">
                DROPPDD<span className="text-zinc-50">.</span>
              </span>
              <span className="text-[7px] tracking-[0.3em] font-black text-zinc-600 uppercase mt-0.5">
                AGGRESSIVE ATHLETICISM
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[10px] bg-orange-500/10 text-orange-500 font-black px-2.5 py-1.5 rounded-sm border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)] italic">
                🔥 12 DAYS
              </div>
              
              {session?.user && (
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="p-2 text-zinc-500 hover:text-orange-500 transition-colors border border-zinc-800 rounded-sm bg-zinc-900/50"
                    title="Sign out"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25"
                      />
                    </svg>
                  </button>
                </form>
              )}
            </div>
          </header>

          {/* Main content container */}
          <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-12 pb-24 md:pb-12 max-w-5xl w-full mx-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
