"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavbarProps {
  userEmail: string | null;
  username?: string | null;
  signOutAction: () => Promise<void>;
  isAdmin?: boolean;
  currentStreak?: number;
}

export default function Navbar({ userEmail, username = null, signOutAction, isAdmin = false, currentStreak = 0 }: NavbarProps) {
  const pathname = usePathname();

  // Helper to determine if path is active (exact match, or sub-path match for nested pages)
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const navItems: NavItem[] = [
    {
      label: "DASHBOARD",
      href: "/",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
          />
        </svg>
      ),
    },
    {
      label: "CHECK-IN",
      href: "/checkin",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      ),
    },
    {
      label: "WORKOUTS",
      href: "/workouts",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 9h16.5m-16.5 6.75h16.5M3.75 12h16.5M12 19.5v-15"
          />
          <circle cx="4" cy="12" r="2" fill="currentColor" />
          <circle cx="20" cy="12" r="2" fill="currentColor" />
        </svg>
      ),
    },
    {
      label: "MEALS",
      href: "/meals",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 18a3.75 3.75 0 0 0 .495-7.467 5.99 5.99 0 0 0-1.925 3.546 5.974 5.974 0 0 1-2.133-1A3.75 3.75 0 0 0 12 18Z"
          />
        </svg>
      ),
    },
    {
      label: "PROGRESS",
      href: "/progress",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941"
          />
        </svg>
      ),
    },
    {
      label: "WAGERS",
      href: "/wagers",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      ),
    },
    {
      label: "LEADERBOARD",
      href: "/leaderboard",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H11.25m0-6.75V4.5m0 3.375L9 5.25m2.25 2.625L13.5 5.25M7.5 15.375v-2.25a2.625 2.625 0 0 1 2.625-2.625h3.75A2.625 2.625 0 0 1 16.5 13.125v2.25"
          />
        </svg>
      ),
    },
    {
      label: "PROFILE",
      href: "/profile",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
          />
        </svg>
      ),
    },
  ];

  if (isAdmin) {
    navItems.push({
      label: "ADMIN",
      href: "/admin",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
          />
        </svg>
      ),
    });
  }

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:h-screen md:sticky md:top-0 md:bg-brand-card md:text-brand-text border-r border-brand-border flex-shrink-0">
        <div className="p-6 border-b border-brand-border">
          <Link href="/" className="group block focus:outline-none">
            <span className="font-black tracking-widest text-3xl text-brand-orange italic block group-hover:text-white transition-colors">
              DROPPDD<span className="text-brand-text">.</span>
            </span>
            <span className="text-[10px] tracking-[0.2em] font-extrabold text-brand-text-muted block mt-1 uppercase">
              AGGRESSIVE ATHLETICISM
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-none font-black text-sm tracking-widest transition-all duration-200 border-l-4 ${
                  active
                    ? "bg-brand-bg border-brand-orange text-brand-orange"
                    : "border-transparent text-brand-text-muted hover:bg-brand-bg/50 hover:text-brand-text"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-brand-border bg-brand-bg/10">
          <div className="flex items-center gap-4 p-3 bg-brand-bg/40 border border-brand-border rounded-none mb-6">
            <div className="w-10 h-10 rounded-full bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(255,84,0,0.15)]">
              🔥
            </div>
            <div>
              <p className="text-[10px] text-brand-text-muted font-extrabold tracking-[0.15em] uppercase leading-none mb-1">STREAK</p>
              <p className="text-sm font-black text-brand-text leading-none italic">{currentStreak} {currentStreak === 1 ? "DAY" : "DAYS"} <span className="text-brand-orange">STRONG</span></p>
            </div>
          </div>

          {userEmail && (
            <div className="space-y-4">
              <div className="flex flex-col gap-1 px-1">
                <p className="text-[9px] text-brand-text-muted/65 font-bold tracking-widest uppercase">ACTIVE OPERATOR</p>
                <p className="text-xs font-black text-brand-text-muted truncate tracking-tight uppercase italic">{username ? `@${username}` : userEmail}</p>
              </div>
              
              <form action={signOutAction} className="pt-2">
                <button
                  type="submit"
                  className="w-full text-left text-[10px] font-black tracking-[0.2em] uppercase text-brand-text-muted hover:text-brand-orange transition-all duration-200 flex items-center gap-2 group cursor-pointer"
                >
                  <span className="w-4 h-[1px] bg-brand-border group-hover:bg-brand-orange/50 transition-colors"></span>
                  TERMINATE SESSION
                </button>
              </form>
            </div>
          )}
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-18 bg-brand-card/95 backdrop-blur-md border-t border-brand-border flex items-center justify-around px-4 pb-safe z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full py-3 transition-all duration-200 ${
                active 
                  ? "text-brand-orange scale-110" 
                  : "text-brand-text-muted hover:text-brand-text"
              }`}
            >
              <div className={`${active ? "drop-shadow-[0_0_8px_rgba(255,84,0,0.4)]" : ""}`}>
                {item.icon}
              </div>
              <span className={`text-[8px] font-black tracking-[0.15em] uppercase mt-1.5 ${active ? "opacity-100" : "opacity-60"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
