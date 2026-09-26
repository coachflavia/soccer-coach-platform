"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navigation = [
  { label: "Dashboard", href: "/", active: (path: string) => path === "/" },
  { label: "Teams", href: "/teams", active: (path: string) => path.startsWith("/teams") },
  { label: "Training", href: "/training", active: (path: string) => path.startsWith("/training") && !path.startsWith("/training/drills") },
  { label: "Drills", href: "/training/drills", active: (path: string) => path.startsWith("/training/drills") },
  { label: "Games", href: "/games", active: (path: string) => path.startsWith("/games") },
];

export function ApplicationShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-900/95">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex min-h-16 items-center justify-between gap-4">
            <Link href="/" className="shrink-0 text-lg font-bold" aria-label="Coach Hub dashboard">
              Coach <span className="text-emerald-400">Hub</span>
            </Link>
            <nav className="-mr-2 flex min-w-0 items-center gap-1 overflow-x-auto py-2 text-sm font-semibold" aria-label="Primary navigation">
              {navigation.map((item) => {
                const isActive = item.active(pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`min-h-11 shrink-0 rounded-lg px-3 py-3 transition sm:min-h-0 sm:py-2 ${
                      isActive
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
