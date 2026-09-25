"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImageUpload } from "./image-upload";
import { LocalImageAsset } from "../lib/media";
import { parseTeams, saveTeams, TEAM_STORAGE_KEY, Team } from "../lib/team-data";

const ageGroups = ["U6", "U7", "U8", "U9", "U10", "U11", "U12", "U13", "U14", "U15", "U16", "U17", "U18", "U19", "Adult"];
const field = "mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-emerald-500";

export function TeamForm({ team }: { team?: Team }) {
  const router = useRouter();
  const [logo, setLogo] = useState<LocalImageAsset | null>(team?.branding.logo ?? null);
  const [error, setError] = useState("");

  function submit(formData: FormData) {
    const value = (name: string) => String(formData.get(name) ?? "").trim();
    if (!["name", "ageGroup", "gender", "teamType", "season"].every((name) => value(name))) {
      setError("Complete all required fields before saving the team."); return;
    }
    const teams = parseTeams(window.localStorage.getItem(TEAM_STORAGE_KEY));
    const saved: Team = {
      id: team?.id ?? crypto.randomUUID(), name: value("name"), ageGroup: value("ageGroup"),
      gender: value("gender"), teamType: value("teamType"), club: value("club"),
      season: value("season"), branding: { logo },
    };
    try {
      saveTeams(team ? teams.map((item) => item.id === team.id ? saved : item) : [...teams, saved]);
      router.push(team ? `/teams/${team.id}` : "/teams");
    } catch {
      setError("This browser does not have enough local storage for that image. Try a smaller image or remove it.");
    }
  }

  return <form action={submit} className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-8">
    <div className="space-y-6">
      <ImageUpload value={logo} onChange={setLogo} label="Team / club logo" initials={(team?.name ?? "").slice(0, 2).toUpperCase()} />
      <label className="block text-sm font-medium text-slate-300">Team Name *<input name="name" defaultValue={team?.name} placeholder="Example: Chicago United 2013 Girls" required className={field} /></label>
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-300">Age Group *<select name="ageGroup" defaultValue={team?.ageGroup ?? ""} required className={field}><option value="">Select age group</option>{ageGroups.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label className="text-sm font-medium text-slate-300">Gender *<select name="gender" defaultValue={team?.gender ?? ""} required className={field}><option value="">Select gender</option><option>Girls / Women</option><option>Boys / Men</option><option>Mixed</option></select></label>
        <label className="text-sm font-medium text-slate-300">Team Type *<select name="teamType" defaultValue={team?.teamType ?? ""} required className={field}><option value="">Select team type</option><option>Competitive</option><option>Recreational</option><option>School</option><option>Academy</option></select></label>
        <label className="text-sm font-medium text-slate-300">Season *<input name="season" defaultValue={team?.season} placeholder="Example: 2026–2027" required className={field} /></label>
      </div>
      <label className="block text-sm font-medium text-slate-300">Club<input name="club" defaultValue={team?.club} placeholder="Example: Chicago United FC" className={field} /></label>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <button className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-400">{team ? "Save changes" : "Create Team"}</button>
    </div>
  </form>;
}
