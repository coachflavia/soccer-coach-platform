import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r border-slate-800 bg-slate-900 p-6">
          <h1 className="text-2xl font-bold">Coach Hub</h1>

          <p className="mt-1 text-sm text-slate-400">
            Soccer Coaching Platform
          </p>

          <nav className="mt-10 space-y-2">
            <div className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950">
              Dashboard
            </div>

            <Link
  href="/teams"
  className="block rounded-xl px-4 py-3 text-slate-300 hover:bg-slate-800"
>
  My Teams
</Link>
              
            

            <div className="rounded-xl px-4 py-3 text-slate-300">
              Players
            </div>

            <Link href="/training" className="block rounded-xl px-4 py-3 text-slate-300 hover:bg-slate-800">
              Training
            </Link>

            <div className="rounded-xl px-4 py-3 text-slate-300">
              Calendar
            </div>

            <div className="rounded-xl px-4 py-3 text-slate-300">
              Games
            </div>

            <div className="rounded-xl px-4 py-3 text-slate-300">
              Reports
            </div>

            <div className="rounded-xl px-4 py-3 text-slate-300">
              Development
            </div>

            <div className="rounded-xl px-4 py-3 text-slate-300">
              Set Pieces
            </div>

            <div className="rounded-xl px-4 py-3 text-slate-300">
              Attendance
            </div>
          </nav>
        </aside>

        <section className="flex-1 p-8">
          <div className="flex items-center justify-between">
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

            <Link href="/training/new" className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950">
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
        </section>
      </div>
    </main>
  );
}
