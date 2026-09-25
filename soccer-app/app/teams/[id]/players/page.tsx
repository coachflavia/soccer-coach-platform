"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { parseTeams, TEAM_STORAGE_KEY, Team } from "../../../../lib/team-data";
import { LocalImage } from "../../../../components/local-image";
import {
  PLAYER_DATA_EVENT,
  PLAYER_STORAGE_KEY,
  PlayerProfile,
  buildPlayerReportData,
  parsePlayersData,
  playerFullName,
  savePlayersData,
} from "../../../../lib/player-data";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(PLAYER_DATA_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(PLAYER_DATA_EVENT, onChange);
  };
}

function getSnapshot() {
  return `${window.localStorage.getItem(TEAM_STORAGE_KEY) ?? ""}\n${window.localStorage.getItem(PLAYER_STORAGE_KEY) ?? ""}`;
}

function initials(player: PlayerProfile) {
  return `${player.firstName[0] ?? ""}${player.lastName[0] ?? ""}`.toUpperCase();
}

function AddPlayerDialog({ teamId, onClose }: { teamId: string; onClose: () => void }) {
  const [error, setError] = useState("");

  function submit(formData: FormData) {
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const position = String(formData.get("position") ?? "");
    const playerType = String(formData.get("playerType") ?? "");
    if (!firstName || !lastName || !position || !playerType) {
      setError("Add the player’s name, player type, and primary position.");
      return;
    }

    const data = parsePlayersData(window.localStorage.getItem(PLAYER_STORAGE_KEY));
    const jersey = String(formData.get("jerseyNumber") ?? "");
    const player: PlayerProfile = {
      id: crypto.randomUUID(), teamId, firstName, lastName,
      playerType: playerType as PlayerProfile["playerType"],
      jerseyNumber: jersey ? Number(jersey) : null,
      primaryPosition: position,
      secondaryPosition: String(formData.get("secondaryPosition") ?? "") || null,
      dateOfBirth: String(formData.get("dateOfBirth") ?? "") || null,
      preferredFoot: (String(formData.get("preferredFoot") ?? "") || null) as PlayerProfile["preferredFoot"],
      status: "active", email: null, phone: null, guardianName: null, guardianEmail: null,
      joinedAt: new Date().toISOString(), notes: "",
      profilePhoto: null,
    };
    savePlayersData({ ...data, players: [...data.players, player] });
    onClose();
  }

  const field = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="add-player-title">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-600">Roster</p><h2 id="add-player-title" className="mt-1 text-xl font-bold text-slate-950">Add a player</h2></div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">✕</button>
        </div>
        <form action={submit} className="p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">First name *<input name="firstName" className={field} autoFocus /></label>
            <label className="text-sm font-semibold text-slate-700">Last name *<input name="lastName" className={field} /></label>
            <label className="text-sm font-semibold text-slate-700">Jersey number<input name="jerseyNumber" type="number" min="0" max="99" className={field} /></label>
            <label className="text-sm font-semibold text-slate-700">Player type *
              <select name="playerType" className={field} defaultValue="" required><option value="" disabled>Select player type</option><option>Field Player</option><option>Goalkeeper</option></select>
            </label>
            <label className="text-sm font-semibold text-slate-700">Primary position *
              <select name="position" className={field} defaultValue=""><option value="" disabled>Select position</option>{["Goalkeeper","Defender","Fullback","Midfielder","Winger","Forward"].map((item) => <option key={item}>{item}</option>)}</select>
            </label>
            <label className="text-sm font-semibold text-slate-700">Secondary position<input name="secondaryPosition" className={field} placeholder="Optional" /></label>
            <label className="text-sm font-semibold text-slate-700">Date of birth<input name="dateOfBirth" type="date" className={field} /></label>
            <label className="text-sm font-semibold text-slate-700">Preferred foot
              <select name="preferredFoot" className={field} defaultValue=""><option value="">Not specified</option><option value="right">Right</option><option value="left">Left</option><option value="both">Both</option></select>
            </label>
          </div>
          {error && <p className="mt-4 text-sm font-medium text-rose-600">{error}</p>}
          <div className="mt-7 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Cancel</button><button className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700">Add player</button></div>
        </form>
      </div>
    </div>
  );
}

export default function PlayersPage() {
  const { id } = useParams<{ id: string }>();
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => "\n");
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("All positions");
  const [showAdd, setShowAdd] = useState(false);
  const [teamsRaw, playersRaw] = snapshot.split("\n");
  const teams: Team[] = useMemo(() => parseTeams(teamsRaw), [teamsRaw]);
  const team = teams.find((item) => item.id === id);
  const data = useMemo(() => parsePlayersData(playersRaw), [playersRaw]);
  const teamPlayers = data.players.filter((player) => player.teamId === id);
  const filtered = teamPlayers.filter((player) => {
    const matchesQuery = playerFullName(player).toLowerCase().includes(query.toLowerCase()) || String(player.jerseyNumber ?? "").includes(query);
    return matchesQuery && (position === "All positions" || player.primaryPosition === position);
  });
  const evaluated = teamPlayers.filter((player) => data.evaluations.some((evaluation) => evaluation.playerId === player.id));
  const average = evaluated.length ? evaluated.reduce((sum, player) => sum + (buildPlayerReportData(player, data.evaluations).currentEvaluation?.technical.average ?? 0), 0) / evaluated.length : null;

  return (
    <main className="min-h-screen bg-[#f5f7f8] text-slate-950">
      {showAdd && <AddPlayerDialog teamId={id} onClose={() => setShowAdd(false)} />}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/teams" className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-lg text-white">◆</span><span><strong className="block text-sm leading-none">CoachBoard</strong><span className="text-[11px] font-medium text-slate-400">Performance workspace</span></span></Link>
          <div className="flex items-center gap-3"><span className="hidden text-right sm:block"><strong className="block text-xs">Coach account</strong><span className="text-[11px] text-slate-400">Head coach</span></span><span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">CA</span></div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <nav className="flex items-center gap-2 text-sm text-slate-500"><Link href="/teams" className="hover:text-emerald-700">My teams</Link><span>/</span><Link href={`/teams/${id}`} className="hover:text-emerald-700">{team?.name ?? "Team"}</Link><span>/</span><strong className="text-slate-900">Players</strong></nav>
        <div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-600">{team?.ageGroup ?? "Team"} · {team?.season ?? "Current season"}</p><h1 className="mt-2 text-4xl font-bold tracking-tight">Players</h1><p className="mt-2 text-slate-500">Manage your roster and track every player&apos;s development.</p></div>
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-emerald-900/10 hover:bg-emerald-700"><span className="text-lg leading-none">+</span> Add player</button>
        </div>
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm font-medium text-slate-500">Total players</p><p className="mt-2 text-3xl font-bold">{teamPlayers.length}</p><p className="mt-1 text-xs font-semibold text-emerald-600">{teamPlayers.filter((p) => p.status === "active").length} active</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm font-medium text-slate-500">Evaluations completed</p><p className="mt-2 text-3xl font-bold">{data.evaluations.filter((e) => e.teamId === id).length}</p><p className="mt-1 text-xs text-slate-400">Across {evaluated.length} players</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-sm font-medium text-slate-500">Team rating</p><p className="mt-2 text-3xl font-bold">{average ? average.toFixed(1) : "—"}<span className="text-base font-medium text-slate-400"> / 5</span></p><p className="mt-1 text-xs text-slate-400">Latest player evaluations</p></div>
        </section>
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-sm"><span className="absolute left-3 top-2.5 text-slate-400">⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search player or number" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500" /></div>
            <select value={position} onChange={(e) => setPosition(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none"><option>All positions</option>{["Goalkeeper","Defender","Fullback","Midfielder","Winger","Forward"].map((item) => <option key={item}>{item}</option>)}</select>
          </div>
          {filtered.length ? <div className="divide-y divide-slate-100">{filtered.map((player) => {
            const report = buildPlayerReportData(player, data.evaluations);
            return <Link key={player.id} href={`/teams/${id}/players/${player.id}`} className="grid items-center gap-4 px-5 py-4 transition hover:bg-slate-50 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]">
              <div className="flex items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-50 text-sm font-bold text-emerald-700">{player.profilePhoto ? <LocalImage src={player.profilePhoto.dataUrl} alt="" /> : initials(player)}</span><span><strong className="block text-sm">{playerFullName(player)}</strong><span className="text-xs text-slate-400">#{player.jerseyNumber ?? "—"} · {player.playerType}</span></span></div>
              <span><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:hidden">Position</span><span className="text-sm font-medium text-slate-700">{player.primaryPosition}</span></span>
              <span><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:hidden">Status</span><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold capitalize text-emerald-700"><i className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{player.status}</span></span>
              <span><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:hidden">Technical average</span><strong className="text-sm">{report.currentEvaluation?.technical.average.toFixed(1) ?? "Not rated"}</strong></span><span className="text-xl text-slate-300">›</span>
            </Link>;
          })}</div> : <div className="px-6 py-16 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">♟</span><h2 className="mt-4 text-lg font-bold">{teamPlayers.length ? "No players match your filters" : "Build your roster"}</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{teamPlayers.length ? "Try another name or position." : "Add player profiles now, then record structured evaluations throughout the season."}</p>{!teamPlayers.length && <button onClick={() => setShowAdd(true)} className="mt-5 text-sm font-bold text-emerald-700">+ Add your first player</button>}</div>}
        </section>
      </div>
    </main>
  );
}
