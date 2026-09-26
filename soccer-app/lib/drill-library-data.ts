import { createId, sessionTypes, type DrillDiagram, type TrainingDrill } from "./training-data";

export const DRILL_LIBRARY_STORAGE_KEY = "soccer-coach-drill-library";
export const DRILL_LIBRARY_EVENT = "soccer-coach-drill-library-updated";

export const drillCategories = ["Warm Up", "Technical", "Tactical", "Possession", "Passing", "Finishing", "Defending", "Attacking", "Transition", "Small-Sided Game", "Goalkeeping", "Physical / Fitness", "Set Piece", "Other"] as const;
export const drillAgeGroups = ["U5–U7", "U8–U10", "U11–U13", "U14–U16", "U17–U19", "Senior", "All Ages"] as const;
export type DrillCategory = (typeof drillCategories)[number];
export type DrillOwnership = { scope: "personal" | "club" | "department"; ownerId: string | null; organizationId: string | null; departmentId: string | null };

export type LibraryDrill = {
  id: string; name: string; description: string; coachingPoints: string; progressions: string;
  objectives: string; duration: number; playerCount: number; area: string; diagram: DrillDiagram | null;
  sessionType: (typeof sessionTypes)[number]; category: DrillCategory; ageGroups: string[]; tags: string[];
  notes: string; createdAt: string; updatedAt: string; ownership: DrillOwnership;
};

export function emptyLibraryDrill(): LibraryDrill {
  const now = new Date().toISOString();
  return { id: createId(), name: "", description: "", coachingPoints: "", progressions: "", objectives: "", duration: 0, playerCount: 0, area: "", diagram: null, sessionType: sessionTypes[0], category: "Other", ageGroups: [], tags: [], notes: "", createdAt: now, updatedAt: now, ownership: { scope: "personal", ownerId: null, organizationId: null, departmentId: null } };
}

function normalize(value: Partial<LibraryDrill>): LibraryDrill {
  const blank = emptyLibraryDrill();
  return { ...blank, ...value, id: typeof value.id === "string" && value.id ? value.id : blank.id,
    name: typeof value.name === "string" ? value.name : "Untitled drill",
    category: drillCategories.includes(value.category as DrillCategory) ? value.category as DrillCategory : "Other",
    sessionType: sessionTypes.includes(value.sessionType as LibraryDrill["sessionType"]) ? value.sessionType as LibraryDrill["sessionType"] : sessionTypes[0],
    ageGroups: Array.isArray(value.ageGroups) ? value.ageGroups.filter((v): v is string => typeof v === "string") : [],
    tags: Array.isArray(value.tags) ? value.tags.filter((v): v is string => typeof v === "string") : [],
    diagram: value.diagram && typeof value.diagram === "object" ? value.diagram : null,
    ownership: value.ownership && typeof value.ownership === "object" ? { ...blank.ownership, ...value.ownership } : blank.ownership };
}

export function parseLibraryDrills(raw: string | null): LibraryDrill[] {
  if (!raw) return [];
  try { const value: unknown = JSON.parse(raw); return Array.isArray(value) ? value.filter(v => v && typeof v === "object").map(v => normalize(v as Partial<LibraryDrill>)) : []; } catch { return []; }
}
export function saveLibraryDrills(drills: LibraryDrill[]) {
  window.localStorage.setItem(DRILL_LIBRARY_STORAGE_KEY, JSON.stringify(drills));
  window.dispatchEvent(new Event(DRILL_LIBRARY_EVENT));
}
export function duplicateLibraryDrill(source: LibraryDrill): LibraryDrill {
  const now = new Date().toISOString();
  return { ...structuredClone(source), id: createId(), name: `${source.name || "Drill"} (Copy)`, createdAt: now, updatedAt: now };
}
export function libraryDrillToSessionDrill(source: LibraryDrill): TrainingDrill {
  return { id: createId(), sourceDrillId: source.id, name: source.name, duration: source.duration, playerCount: source.playerCount, area: source.area, objectives: source.objectives, description: source.description, coachingPoints: source.coachingPoints, progressions: source.progressions, notes: source.notes, diagram: source.diagram ? structuredClone(source.diagram) : null, category: source.category, sessionType: source.sessionType, ageGroups: [...source.ageGroups], tags: [...source.tags] };
}
export function sessionDrillToLibrary(source: TrainingDrill): LibraryDrill {
  const drill = emptyLibraryDrill();
  return { ...drill, name: source.name, duration: source.duration, playerCount: source.playerCount, area: source.area, objectives: source.objectives, description: source.description, coachingPoints: source.coachingPoints, progressions: source.progressions, notes: source.notes, diagram: source.diagram ? structuredClone(source.diagram) : null, category: drillCategories.includes(source.category as DrillCategory) ? source.category as DrillCategory : "Other", sessionType: source.sessionType ?? sessionTypes[0], ageGroups: [...(source.ageGroups ?? [])], tags: [...(source.tags ?? [])] };
}
