"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { parseTeams, TEAM_DATA_EVENT, TEAM_STORAGE_KEY } from "../../lib/team-data";
import { LocalImage } from "../../components/local-image";

function subscribeToTeams(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(TEAM_DATA_EVENT, onStoreChange);

  return () => { window.removeEventListener("storage", onStoreChange); window.removeEventListener(TEAM_DATA_EVENT, onStoreChange); };
}

function getStoredTeams() {
  return window.localStorage.getItem(TEAM_STORAGE_KEY);
}

export default function TeamsPage() {
  const storedTeams = useSyncExternalStore(
    subscribeToTeams,
    getStoredTeams,
    () => null,
  );
  const teams = parseTeams(storedTeams);

  return (

    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
              My Teams
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Your Teams
            </h1>

            <p className="mt-2 text-slate-400">
              Create and manage all of your teams in one place.
            </p>
          </div>

          <Link
  href="/teams/new"
  className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950"
>
  + Create Team
</Link>
            
          
        </div>

        {teams.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-12 text-center">
            <div className="mx-auto max-w-md">
              <div className="text-5xl">⚽</div>

              <h2 className="mt-5 text-2xl font-semibold">No teams yet</h2>

              <p className="mt-3 text-slate-400">
                Create your first team to start adding players, planning training
                sessions, and tracking games.
              </p>

              <Link
                href="/teams/new"
                className="mt-6 inline-block rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950"
              >
                Create Your First Team
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <Link
  key={team.id}
  href={`/teams/${team.id}`}
  className="block rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-emerald-500 hover:bg-slate-800"
>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-800 text-sm font-bold text-emerald-300">
                      {team.branding.logo ? <LocalImage src={team.branding.logo.dataUrl} alt="" /> : team.name.slice(0, 2).toUpperCase()}
                    </span><div>
                    <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
                      {team.ageGroup} · {team.gender}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">{team.name}</h2>
                  </div></div>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                    {team.teamType}
                  </span>
                </div>
                <div className="mt-6 space-y-2 text-sm text-slate-400">
                  <p>{team.club || "Independent team"}</p>
                  <p>{team.season}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
