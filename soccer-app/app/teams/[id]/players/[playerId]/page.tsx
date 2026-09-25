"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { ImageUpload } from "../../../../../components/image-upload";
import { LocalImage } from "../../../../../components/local-image";
import {
  PLAYER_DATA_EVENT,
  PLAYER_STORAGE_KEY,
  PlayerEvaluation,
  PlayerProfile,
  TechnicalRatings,
  buildPlayerReportData,
  calculateTechnicalAverage,
  getTechnicalCriteria,
  parsePlayersData,
  playerFullName,
  savePlayersData,
} from "../../../../../lib/player-data";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(PLAYER_DATA_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(PLAYER_DATA_EVENT, onChange);
  };
}

const getSnapshot = () => window.localStorage.getItem(PLAYER_STORAGE_KEY) ?? "";
const formatChange = (change: number) => `${change > 0 ? "+" : ""}${change.toFixed(1)}`;

function EvaluationDialog({ player, onClose }: { player: PlayerProfile; onClose: () => void }) {
  const criteria = getTechnicalCriteria(player.playerType);
  const [ratings, setRatings] = useState<TechnicalRatings>({});
  const [error, setError] = useState("");

  function submit(formData: FormData) {
    if (criteria.some(({ key }) => ratings[key] === undefined)) {
      setError("Rate every technical characteristic before saving.");
      return;
    }
    const list = (name: string) => String(formData.get(name) ?? "")
      .split("\n").map((item) => item.trim()).filter(Boolean);
    const technicalAverage = calculateTechnicalAverage(ratings);
    const technicalNotes = String(formData.get("technicalNotes") ?? "").trim();
    const evaluation: PlayerEvaluation = {
      id: crypto.randomUUID(),
      playerId: player.id,
      teamId: player.teamId,
      evaluatedAt: String(formData.get("evaluatedAt")),
      evaluator: String(formData.get("evaluator") ?? "").trim() || "Coach",
      period: String(formData.get("period") ?? "").trim() || "Technical review",
      technical: {
        playerType: player.playerType,
        ratings,
        average: technicalAverage,
        notes: technicalNotes,
      },
      strengths: list("strengths"),
      developmentPriorities: list("priorities"),
      coachNotes: technicalNotes,
      nextReviewAt: String(formData.get("nextReviewAt")) || null,
    };
    const data = parsePlayersData(window.localStorage.getItem(PLAYER_STORAGE_KEY));
    savePlayersData({ ...data, evaluations: [...data.evaluations, evaluation] });
    onClose();
  }

  const input = "mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";
  const liveAverage = calculateTechnicalAverage(ratings);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="evaluation-title">
      <div className="mx-auto my-4 max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-600">{player.playerType} · Technical evaluation</p>
            <h2 id="evaluation-title" className="mt-1 text-xl font-bold">New evaluation</h2>
          </div>
          <button onClick={onClose} className="self-start rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close">✕</button>
        </div>
        <form action={submit} className="p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-semibold text-slate-700">Evaluation date<input required name="evaluatedAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={input} /></label>
            <label className="text-sm font-semibold text-slate-700">Review period<input name="period" placeholder="Fall checkpoint" className={input} /></label>
            <label className="text-sm font-semibold text-slate-700">Evaluator<input name="evaluator" placeholder="Coach name" className={input} /></label>
          </div>

          <div className="mt-7 flex items-end justify-between">
            <div><h3 className="font-bold">Technical characteristics</h3><p className="mt-1 text-xs text-slate-500">1 developing · 3 meeting expectations · 5 exceptional</p></div>
            <div className="text-right"><span className="text-xs font-bold uppercase tracking-wider text-slate-400">Technical average</span><p className="text-2xl font-bold text-emerald-700">{Object.keys(ratings).length ? liveAverage.toFixed(1) : "—"}<span className="text-sm text-slate-400"> / 5</span></p></div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {criteria.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <strong className="text-sm">{label}</strong>
                <div className="flex gap-1" aria-label={`${label} rating`}>
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button type="button" key={score} onClick={() => setRatings((current) => ({ ...current, [key]: score }))} className={`h-8 w-8 rounded-lg text-xs font-bold ${ratings[key] === score ? "bg-emerald-600 text-white" : "border border-slate-200 bg-white text-slate-500 hover:border-emerald-400"}`}>{score}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">Key strengths <span className="font-normal text-slate-400">(one per line)</span><textarea name="strengths" rows={4} className={input} /></label>
            <label className="text-sm font-semibold text-slate-700">Development priorities <span className="font-normal text-slate-400">(one per line)</span><textarea name="priorities" rows={4} className={input} /></label>
          </div>
          <label className="mt-5 block text-sm font-semibold text-slate-700">Technical / coach notes<textarea name="technicalNotes" rows={3} className={input} placeholder="Add observations, evidence, and recommended actions…" /></label>
          <label className="mt-5 block max-w-xs text-sm font-semibold text-slate-700">Next review date<input name="nextReviewAt" type="date" className={input} /></label>
          {error && <p className="mt-4 text-sm font-semibold text-rose-600">{error}</p>}
          <div className="mt-7 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700">Cancel</button><button className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">Save evaluation</button></div>
        </form>
      </div>
    </div>
  );
}

function PhotoDialog({ player, onClose }: { player: PlayerProfile; onClose: () => void }) {
  const [photo, setPhoto] = useState(player.profilePhoto);
  const [error, setError] = useState("");
  function save() {
    const data = parsePlayersData(window.localStorage.getItem(PLAYER_STORAGE_KEY));
    try {
      savePlayersData({ ...data, players: data.players.map((item) => item.id === player.id ? { ...item, profilePhoto: photo } : item) });
      onClose();
    } catch {
      setError("This browser does not have enough local storage for that photo. Try a smaller image or remove it.");
    }
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="photo-title"><div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 text-white"><div className="flex justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Player profile</p><h2 id="photo-title" className="mt-1 text-xl font-bold">Profile photo</h2></div><button onClick={onClose} aria-label="Close" className="text-slate-400">✕</button></div><div className="mt-6"><ImageUpload value={photo} onChange={setPhoto} label="Player photo" initials={`${player.firstName[0] ?? ""}${player.lastName[0] ?? ""}`} shape="circle" /></div>{error && <p className="mt-4 text-sm text-rose-400">{error}</p>}<div className="mt-7 flex justify-end gap-3"><button onClick={onClose} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold">Cancel</button><button onClick={save} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950">Save photo</button></div></div></div>;
}

export default function PlayerPage() {
  const { id, playerId } = useParams<{ id: string; playerId: string }>();
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "");
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const data = parsePlayersData(raw);
  const player = data.players.find((item) => item.id === playerId);

  if (!player) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50"><div className="text-center"><h1 className="text-2xl font-bold">Player not found</h1><Link href={`/teams/${id}/players`} className="mt-4 inline-block font-bold text-emerald-700">Return to roster</Link></div></main>;
  }

  const report = buildPlayerReportData(player, data.evaluations);
  const current = report.currentEvaluation;
  const comparison = report.comparison;
  const criteria = getTechnicalCriteria(player.playerType);
  const details = [
    ["Player type", player.playerType],
    ["Primary position", player.primaryPosition],
    ["Preferred foot", player.preferredFoot ?? "—"],
    ["Date of birth", player.dateOfBirth ? new Date(`${player.dateOfBirth}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"],
  ];

  return (
    <main className="min-h-screen bg-[#f5f7f8] text-slate-950">
      {showEvaluation && <EvaluationDialog player={player} onClose={() => setShowEvaluation(false)} />}
      {showPhoto && <PhotoDialog player={player} onClose={() => setShowPhoto(false)} />}
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"><Link href="/teams" className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">◆</span><strong className="text-sm">CoachBoard</strong></Link><span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">CA</span></div></header>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <Link href={`/teams/${id}/players`} className="text-sm font-bold text-slate-500 hover:text-emerald-700">← Back to roster</Link>
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col justify-between gap-6 bg-gradient-to-r from-slate-950 to-slate-800 p-7 text-white sm:flex-row sm:items-center"><div className="flex items-center gap-5"><button onClick={() => setShowPhoto(true)} className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-500 text-2xl font-bold text-slate-950" aria-label="Change player photo">{player.profilePhoto ? <LocalImage src={player.profilePhoto.dataUrl} alt={`${playerFullName(player)} profile`} /> : <>{player.firstName[0]}{player.lastName[0]}</>}<span className="absolute inset-x-0 bottom-0 bg-slate-950/75 py-1 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">Edit photo</span></button><div><div className="flex items-center gap-3"><h1 className="text-3xl font-bold">{playerFullName(player)}</h1><span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-bold capitalize text-emerald-300">{player.status}</span></div><p className="mt-2 text-sm text-slate-300">#{player.jerseyNumber ?? "—"} · {player.playerType} · {player.primaryPosition}</p><button onClick={() => setShowPhoto(true)} className="mt-2 text-xs font-semibold text-emerald-300 hover:text-emerald-200">{player.profilePhoto ? "Change profile photo" : "Add profile photo"}</button></div></div><button onClick={() => setShowEvaluation(true)} className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400">+ New evaluation</button></div>
          <dl className="grid gap-px bg-slate-100 sm:grid-cols-4">{details.map(([label, value]) => <div key={label} className="bg-white px-6 py-5"><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-1.5 text-sm font-bold capitalize text-slate-800">{value}</dd></div>)}</dl>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_.8fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Latest assessment</p><h2 className="mt-1 text-xl font-bold">Technical snapshot</h2></div>{current && <div className="text-right"><span className="text-xs font-bold uppercase tracking-wider text-slate-400">Technical average</span><p><strong className="text-3xl">{current.technical.average.toFixed(1)}</strong><span className="text-sm text-slate-400"> / 5</span></p></div>}</div>
              {current ? <><div className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">{criteria.map(({ key, label }) => <div key={key}><div className="mb-1.5 flex justify-between"><span className="text-sm font-semibold text-slate-600">{label}</span><strong className="text-sm">{current.technical.ratings[key] ?? "—"}</strong></div><span className="block h-2 overflow-hidden rounded-full bg-slate-100"><i className="block h-full rounded-full bg-emerald-500" style={{ width: `${(current.technical.ratings[key] ?? 0) * 20}%` }} /></span></div>)}</div><div className="mt-7 grid gap-5 sm:grid-cols-2"><div><h3 className="text-sm font-bold">Strengths</h3><ul className="mt-3 space-y-2">{current.strengths.map((item) => <li key={item} className="flex gap-2 text-sm text-slate-600"><span className="text-emerald-500">✓</span>{item}</li>)}</ul></div><div><h3 className="text-sm font-bold">Development priorities</h3><ul className="mt-3 space-y-2">{current.developmentPriorities.map((item) => <li key={item} className="flex gap-2 text-sm text-slate-600"><span className="text-amber-500">→</span>{item}</li>)}</ul></div></div>{current.technical.notes && <div className="mt-6 rounded-xl bg-slate-50 p-4"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Technical / coach notes</h3><p className="mt-2 text-sm leading-6 text-slate-600">{current.technical.notes}</p></div>}</> : <div className="py-14 text-center"><p className="text-sm text-slate-500">No technical evaluation has been recorded.</p><button onClick={() => setShowEvaluation(true)} className="mt-4 text-sm font-bold text-emerald-700">Create the first evaluation</button></div>}
            </section>

            {comparison && <section className="rounded-2xl border border-slate-200 bg-white p-6"><div><p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Latest vs previous</p><h2 className="mt-1 text-xl font-bold">Technical progress</h2></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-4"><span className="text-xs font-bold text-slate-400">Previous average</span><p className="mt-1 text-2xl font-bold">{comparison.previousAverage.toFixed(1)}</p></div><div className="rounded-xl bg-slate-50 p-4"><span className="text-xs font-bold text-slate-400">Current average</span><p className="mt-1 text-2xl font-bold">{comparison.currentAverage.toFixed(1)}</p></div><div className="rounded-xl bg-slate-50 p-4"><span className="text-xs font-bold text-slate-400">Change</span><p className={`mt-1 text-2xl font-bold ${comparison.averageChange > 0 ? "text-emerald-600" : comparison.averageChange < 0 ? "text-rose-600" : "text-slate-600"}`}>{formatChange(comparison.averageChange)}</p></div></div><div className="mt-5 overflow-hidden rounded-xl border border-slate-200"><div className="grid grid-cols-[1fr_60px_60px_70px_92px] bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400"><span>Characteristic</span><span>Previous</span><span>Current</span><span>Change</span><span>Result</span></div>{comparison.criteria.map((item) => <div key={item.key} className="grid grid-cols-[1fr_60px_60px_70px_92px] items-center border-t border-slate-100 px-4 py-3 text-sm"><strong>{item.label}</strong><span>{item.previous ?? "—"}</span><span>{item.current ?? "—"}</span><span>{item.change === null ? "—" : formatChange(item.change)}</span><span className={`text-xs font-bold ${item.direction === "Improved" ? "text-emerald-600" : item.direction === "Declined" ? "text-rose-600" : "text-slate-500"}`}>{item.direction}</span></div>)}</div></section>}
          </div>

          <aside className="space-y-6"><section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-bold">Evaluation history</h2><div className="mt-5 space-y-5">{report.evaluations.length ? report.evaluations.map((evaluation, index) => <div key={evaluation.id} className="relative border-l-2 border-slate-100 pl-4"><i className={`absolute -left-[5px] top-1 h-2 w-2 rounded-full ${index === 0 ? "bg-emerald-500" : "bg-slate-300"}`} /><div className="flex justify-between"><strong className="text-sm">{evaluation.period}</strong><strong className="text-sm text-emerald-700">{evaluation.technical.average.toFixed(1)} / 5</strong></div><p className="mt-1 text-xs text-slate-400">{new Date(`${evaluation.evaluatedAt}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {evaluation.evaluator}</p></div>) : <p className="text-sm text-slate-400">Evaluations will appear here.</p>}</div></section><section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6"><p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Report-ready data</p><h2 className="mt-2 font-bold">Structured for future export</h2><p className="mt-2 text-sm leading-6 text-emerald-900/70">Player details, technical ratings, comparisons, notes, priorities, and history are available to future print and PDF report components.</p></section></aside>
        </div>
      </div>
    </main>
  );
}
