"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import { TeamForm } from "../../../../components/team-form";
import { parseTeams, TEAM_DATA_EVENT, TEAM_STORAGE_KEY } from "../../../../lib/team-data";

function subscribe(change: () => void) {
  window.addEventListener("storage", change); window.addEventListener(TEAM_DATA_EVENT, change);
  return () => { window.removeEventListener("storage", change); window.removeEventListener(TEAM_DATA_EVENT, change); };
}

export default function EditTeamPage() {
  const { id } = useParams<{ id: string }>();
  const raw = useSyncExternalStore(subscribe, () => window.localStorage.getItem(TEAM_STORAGE_KEY) ?? "", () => "");
  const team = parseTeams(raw).find((item) => item.id === id);
  if (!team) return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white"><div className="text-center"><h1 className="text-2xl font-bold">Team not found</h1><Link href="/teams" className="mt-4 inline-block text-emerald-400">Back to My Teams</Link></div></main>;
  return <main className="min-h-screen bg-slate-950 text-white"><div className="mx-auto max-w-3xl px-6 py-10">
    <Link href={`/teams/${id}`} className="text-sm font-semibold text-slate-400 hover:text-emerald-400">← Back to dashboard</Link>
    <p className="mt-8 text-sm font-semibold uppercase tracking-widest text-emerald-400">Team settings</p>
    <h1 className="mt-2 text-4xl font-bold">Edit {team.name}</h1>
    <p className="mt-2 text-slate-400">Update basic details and club branding.</p>
    <TeamForm team={team} />
  </div></main>;
}
