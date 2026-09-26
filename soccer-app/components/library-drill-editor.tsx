"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { DiagramCanvas } from "./diagram-canvas";
import { DiagramEditor } from "./diagram-editor";
import { TrainingShell } from "./training-shell";
import { packDiagram, unpackDiagram } from "../lib/diagram-data";
import { DRILL_LIBRARY_EVENT, DRILL_LIBRARY_STORAGE_KEY, drillAgeGroups, drillCategories, emptyLibraryDrill, goalkeepingClassifications, libraryAreas, miniKickersThemes, parseLibraryDrills, performanceClassifications, saveLibraryDrills, type LibraryArea, type LibraryDrill, type MiniKickersTheme } from "../lib/drill-library-data";
import { parseTeams, TEAM_DATA_EVENT, TEAM_STORAGE_KEY } from "../lib/team-data";
import { sessionTypes } from "../lib/training-data";

const subscribe = (change: () => void) => { window.addEventListener("storage", change); window.addEventListener(DRILL_LIBRARY_EVENT, change); window.addEventListener(TEAM_DATA_EVENT, change); return () => { window.removeEventListener("storage", change); window.removeEventListener(DRILL_LIBRARY_EVENT, change); window.removeEventListener(TEAM_DATA_EVENT, change); }; };
const areaLabels: Record<LibraryArea,string> = { personal: "Personal Library", academy: "Academy / Teams", goalkeeping: "Goalkeeping Department", performance: "Performance", "mini-kickers": "Mini Kickers / PGS" };
const blankTheme: MiniKickersTheme = { name: "", iconRef: null, artworkRef: null, description: "", ageRange: "", sessionStory: "", instructions: "" };

export function LibraryDrillEditor({ drillId, initialArea = "personal" }: { drillId?: string; initialArea?: LibraryArea }) {
  const router = useRouter();
  const raw = useSyncExternalStore(subscribe, () => localStorage.getItem(DRILL_LIBRARY_STORAGE_KEY) ?? "", () => "");
  const teamRaw = useSyncExternalStore(subscribe, () => localStorage.getItem(TEAM_STORAGE_KEY) ?? "", () => "");
  const stored = useMemo(() => parseLibraryDrills(raw), [raw]);
  const teams = useMemo(() => parseTeams(teamRaw), [teamRaw]);
  const existing = drillId ? stored.find(d => d.id === drillId) : undefined;
  const [draft, setDraft] = useState<LibraryDrill>(() => existing ? structuredClone(existing) : { ...emptyLibraryDrill(), libraryArea: initialArea });
  const [loadedId, setLoadedId] = useState<string>(); const [diagramOpen, setDiagramOpen] = useState(false); const [saved, setSaved] = useState(false);
  if (existing && loadedId !== existing.id) { setDraft(structuredClone(existing)); setLoadedId(existing.id); }
  const update = <K extends keyof LibraryDrill>(key: K, value: LibraryDrill[K]) => setDraft(current => ({ ...current, [key]: value }));
  const save = () => { const scope = draft.libraryArea === "personal" ? "personal" : draft.libraryArea === "academy" ? "club" : "department"; const next: LibraryDrill = { ...draft, name: draft.name.trim() || "Untitled drill", updatedAt: new Date().toISOString(), ownership: { ...draft.ownership, scope } }; saveLibraryDrills([...stored.filter(d => d.id !== next.id), next]); setDraft(next); setSaved(true); if (!drillId) router.replace(`/training/drills/${next.id}`); setTimeout(() => setSaved(false), 1800); };
  const toggleAge = (age: string) => update("ageGroups", draft.ageGroups.includes(age) ? draft.ageGroups.filter(v => v !== age) : [...draft.ageGroups, age]);
  const toggleTeam = (id: string) => update("teamIds", draft.teamIds.includes(id) ? draft.teamIds.filter(v => v !== id) : [...draft.teamIds, id]);
  const updateTheme = <K extends keyof MiniKickersTheme>(key: K, value: MiniKickersTheme[K]) => update("miniKickersTheme", { ...(draft.miniKickersTheme ?? blankTheme), [key]: value });
  if (drillId && raw && !existing) return <TrainingShell><div className="mx-auto max-w-3xl px-6 py-20 text-center"><h1 className="text-2xl font-bold">Drill not found</h1><Link href="/training/drills" className="mt-4 inline-block text-emerald-400">Back to drill library</Link></div></TrainingShell>;
  return <TrainingShell><div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    {diagramOpen && <DiagramEditor initial={unpackDiagram(draft.diagram)} drillName={draft.name} onClose={() => setDiagramOpen(false)} onSave={diagram => { update("diagram", packDiagram(diagram)); setDiagramOpen(false); }}/>} 
    <Link href="/training/drills" className="text-sm font-semibold text-slate-400">← Training Library</Link>
    <header className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold uppercase tracking-widest text-emerald-400">{drillId ? "Library exercise" : "New library exercise"}</p><h1 className="mt-2 text-3xl font-bold">{draft.name || "Create reusable exercise"}</h1><p className="mt-2 text-sm text-slate-400">{areaLabels[draft.libraryArea]} · Changes do not affect exercises already added to sessions.</p></div><button onClick={save} className="training-primary">{saved ? "✓ Saved" : "Save Exercise"}</button></header>
    <div className="mt-7 grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,.8fr)]">
      <section className="training-panel"><h2 className="text-xl font-bold">Drill information</h2><div className="training-form-grid mt-5">
        <Field label="Drill name" wide><input className="training-input" value={draft.name} onChange={e => update("name", e.target.value)}/></Field>
        <Field label="Category"><select className="training-input" value={draft.category} onChange={e => update("category", e.target.value as LibraryDrill["category"])}>{drillCategories.map(v => <option key={v}>{v}</option>)}</select></Field>
        <Field label="Training type"><select className="training-input" value={draft.sessionType} onChange={e => update("sessionType", e.target.value as LibraryDrill["sessionType"])}>{sessionTypes.map(v => <option key={v}>{v}</option>)}</select></Field>
        <NumberField label="Duration (min)" value={draft.duration} change={v => update("duration", v)}/><NumberField label="Recommended players" value={draft.playerCount} change={v => update("playerCount", v)}/>
        <Field label="Area / dimensions" wide><input className="training-input" value={draft.area} onChange={e => update("area", e.target.value)} placeholder="e.g. 30 × 20 m"/></Field>
        <Area label="Objectives" value={draft.objectives} change={v => update("objectives", v)}/><Area label="Description / organization" value={draft.description} change={v => update("description", v)}/><Area label="Coaching points" value={draft.coachingPoints} change={v => update("coachingPoints", v)}/><Area label="Progressions / variations" value={draft.progressions} change={v => update("progressions", v)}/><Area label="Notes" value={draft.notes} change={v => update("notes", v)}/>
      </div></section>
      <div className="space-y-5 lg:sticky lg:top-5">
        <section className="training-panel"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Diagram</h2><button onClick={() => setDiagramOpen(true)} className="training-secondary">{draft.diagram ? "Edit" : "Create"} Diagram</button></div><button onClick={() => setDiagramOpen(true)} className="mt-4 block w-full rounded-xl border border-slate-700 bg-slate-950 p-2">{draft.diagram ? <DiagramCanvas diagram={unpackDiagram(draft.diagram)}/> : <span className="flex min-h-44 items-center justify-center text-sm font-bold text-emerald-300">+ Open Diagram Builder</span>}</button></section>
        <section className="training-panel"><h2 className="text-xl font-bold">Library organization</h2><Field label="Library area"><select className="training-input" value={draft.libraryArea} onChange={e => update("libraryArea", e.target.value as LibraryArea)}>{libraryAreas.map(area=><option key={area} value={area}>{areaLabels[area]}</option>)}</select></Field>
          {draft.libraryArea==="goalkeeping"&&<Field label="Goalkeeping focus"><select className="training-input" value={draft.specialization} onChange={e=>update("specialization",e.target.value)}><option value="">Select focus</option>{goalkeepingClassifications.map(v=><option key={v}>{v}</option>)}</select></Field>}
          {draft.libraryArea==="performance"&&<Field label="Performance classification"><select className="training-input" value={draft.specialization} onChange={e=>update("specialization",e.target.value)}><option value="">Select classification</option>{performanceClassifications.map(v=><option key={v}>{v}</option>)}</select></Field>}
          <Field label="Tags (comma separated)"><input className="training-input" value={draft.tags.join(", ")} onChange={e => update("tags", e.target.value.split(",").map(v => v.trim()).filter(Boolean))} placeholder="pressing, rondo, first touch"/></Field><fieldset className="mt-5"><legend className="training-label">Age groups</legend><div className="grid grid-cols-2 gap-2">{drillAgeGroups.map(age => <label key={age} className="flex min-h-11 items-center gap-2 rounded-lg bg-slate-800 px-3 text-sm"><input type="checkbox" checked={draft.ageGroups.includes(age)} onChange={() => toggleAge(age)} className="h-4 w-4 accent-emerald-500"/>{age}</label>)}</div></fieldset>
          {draft.libraryArea==="academy"&&<fieldset className="mt-5"><legend className="training-label">Teams (optional, multiple)</legend><div className="space-y-2">{teams.map(team=><label key={team.id} className="flex min-h-11 items-center gap-2 rounded-lg bg-slate-800 px-3 text-sm"><input type="checkbox" checked={draft.teamIds.includes(team.id)} onChange={()=>toggleTeam(team.id)} className="h-4 w-4 accent-emerald-500"/>{team.name}<span className="ml-auto text-xs text-slate-500">{team.ageGroup}</span></label>)}{!teams.length&&<p className="text-sm text-slate-500">Create a team first to associate this exercise.</p>}</div></fieldset>}
          <p className="mt-5 text-xs text-slate-500">Organization and department ownership are metadata placeholders only; permissions remain deferred.</p></section>
        {draft.libraryArea==="mini-kickers"&&<section className="training-panel"><h2 className="text-xl font-bold">Theme & story</h2><Field label="Theme"><select className="training-input" value={draft.miniKickersTheme?.name??""} onChange={e=>updateTheme("name",e.target.value)}><option value="">Select theme</option>{miniKickersThemes.map(v=><option key={v}>{v}</option>)}</select></Field><Field label="Custom theme / age range"><input className="training-input" value={draft.miniKickersTheme?.ageRange??""} onChange={e=>updateTheme("ageRange",e.target.value)} placeholder="e.g. ages 3–5"/></Field><Area label="Theme description" value={draft.miniKickersTheme?.description??""} change={v=>updateTheme("description",v)}/><Area label="Session story" value={draft.miniKickersTheme?.sessionStory??""} change={v=>updateTheme("sessionStory",v)}/><Area label="Story instructions" value={draft.miniKickersTheme?.instructions??""} change={v=>updateTheme("instructions",v)}/><p className="mt-3 text-xs text-slate-500">Icon and artwork references are reserved in the data model for the visual-design phase.</p></section>}
      </div>
    </div><div className="sticky bottom-3 mt-6 rounded-2xl border border-slate-700 bg-slate-900/95 p-3"><button onClick={save} className="training-primary w-full sm:w-auto">{saved ? "✓ Saved" : "Save Exercise"}</button></div>
  </div></TrainingShell>;
}
function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) { return <label className={`block ${wide ? "sm:col-span-2" : ""}`}><span className="training-label">{label}</span>{children}</label>; }
function Area({ label, value, change }: { label: string; value: string; change: (value: string) => void }) { return <Field label={label} wide><textarea className="training-input min-h-28" value={value} onChange={e => change(e.target.value)}/></Field>; }
function NumberField({ label, value, change }: { label: string; value: number; change: (value: number) => void }) { return <Field label={label}><input type="number" min="0" className="training-input" value={value || ""} onChange={e => change(Number(e.target.value))}/></Field>; }
