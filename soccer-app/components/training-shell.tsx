import Link from "next/link";
import type { ReactNode } from "react";

export function TrainingShell({ children }: { children: ReactNode }) {
  return <main className="min-h-screen bg-slate-950 text-white">
    <header className="border-b border-slate-800 bg-slate-900/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-bold">Coach <span className="text-emerald-400">Hub</span></Link>
        <nav className="flex items-center gap-2 text-sm font-semibold"><Link href="/" className="rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800">Dashboard</Link><Link href="/teams" className="rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800">Teams</Link><Link href="/training" className="rounded-lg bg-emerald-500/15 px-3 py-2 text-emerald-400">Training</Link></nav>
      </div>
    </header>{children}
  </main>;
}
