"use client";

import { useState } from "react";

const TEAM_STORAGE_KEY = "soccer-coach-teams";

type Team = {
  id: string;
  name: string;
  ageGroup: string;
  gender: string;
  teamType: string;
  club: string;
  season: string;
};

export default function TeamsPage() {
  const [teams] = useState<Team[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const storedTeams = window.localStorage.getItem(TEAM_STORAGE_KEY);

    return storedTeams ? JSON.parse(storedTeams) : [];
  });

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

          <a
  href="/teams/new"
  className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950"
>
  + Create Team
</a>
            
          
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

              <a
                href="/teams/new"
                className="mt-6 inline-block rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950"
              >
                Create Your First Team
              </a>
            </div>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <article
                key={team.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
                      {team.ageGroup} · {team.gender}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">{team.name}</h2>
                  </div>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                    {team.teamType}
                  </span>
                </div>
                <div className="mt-6 space-y-2 text-sm text-slate-400">
                  <p>{team.club || "Independent team"}</p>
                  <p>{team.season}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}