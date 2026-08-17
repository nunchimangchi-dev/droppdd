import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import { auth, signOut } from "@/auth";

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
        <Navbar userEmail={session?.user?.email ?? null} signOutAction={signOutAction} />
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Mobile Header */}
          <header className="md:hidden flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 sticky top-0 z-40">
            <span className="font-black tracking-widest text-xl text-orange-500 italic">
              DROPPDD<span className="text-zinc-950 dark:text-zinc-50">.</span>
            </span>
            <div className="flex items-center gap-1.5 text-xs bg-orange-500/15 text-orange-500 font-black px-2 py-1 rounded border border-orange-500/20">
              🔥 12 DAYS
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
