import Link from "next/link";
import { ApplicationShell } from "../components/application-shell";

export default function Home() {
  return (
    <ApplicationShell>
        <main className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
                Dashboard
              </p>

              <h2 className="mt-2 text-4xl font-bold">
                Welcome, Coach
              </h2>

              <p className="mt-2 text-slate-400">
                Everything you need to plan, manage, and develop your team.
              </p>
            </div>

            <Link href="/training/new" className="self-start rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950">
              + New Training Session
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-sm text-slate-400">My Teams</p>
              <p className="mt-2 text-3xl font-bold">0</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-sm text-slate-400">Players</p>
              <p className="mt-2 text-3xl font-bold">0</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-sm text-slate-400">Training Sessions</p>
              <p className="mt-2 text-3xl font-bold">0</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-sm text-slate-400">Games</p>
              <p className="mt-2 text-3xl font-bold">0</p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-xl font-semibold">Upcoming</h3>

              <p className="mt-3 text-slate-400">
                Your upcoming training sessions and games will appear here.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="text-xl font-semibold">Team Snapshot</h3>

              <p className="mt-3 text-slate-400">
                Your team&apos;s latest information and performance will appear here.
              </p>
            </div>
          </div>
        </main>
    </ApplicationShell>
  );
}
