import { createId, sessionTypes, type DrillDiagram, type TrainingDrill } from "./training-data";

export const DRILL_LIBRARY_STORAGE_KEY = "soccer-coach-drill-library";
export const DRILL_LIBRARY_EVENT = "soccer-coach-drill-library-updated";

export const drillCategories = ["Warm Up", "Technical", "Tactical", "Possession", "Passing", "Finishing", "Defending", "Attacking", "Transition", "Small-Sided Game", "Goalkeeping", "Physical / Fitness", "Set Piece", "Other"] as const;
export const drillAgeGroups = ["U5–U7", "U8–U10", "U11–U13", "U14–U16", "U17–U19", "Senior", "All Ages"] as const;
export const libraryAreas = ["personal", "academy", "goalkeeping", "performance", "mini-kickers"] as const;
export const goalkeepingClassifications = ["Handling / Hands", "Footwork", "Set Position", "Diving", "1v1", "Crosses / High Balls", "Distribution / Playing with Feet", "Shot Stopping", "Reactions", "Positioning", "Communication", "Goalkeeper Physical", "Other"] as const;
export const performanceClassifications = ["Warm Up / Activation", "Speed", "Acceleration", "Agility / Change of Direction", "Strength", "Power", "Endurance", "Conditioning", "Mobility", "Recovery", "Injury Prevention", "Testing", "Other"] as const;
export const miniKickersThemes = ["Pirates", "Space / Astronauts", "Zoo / Animals", "Superheroes", "Dinosaurs", "Cars / Racing", "Ocean", "Jungle", "Adventure", "Custom"] as const;
export const miniKickersDevelopmentFocuses = ["Coordination", "Balance", "Agility", "Motor Skills", "Running / Movement", "Reaction", "Spatial Awareness", "Body Awareness", "Rhythm / Timing", "Confidence", "Creativity", "Decision Making", "Listening / Following Instructions", "Social / Teamwork", "Other"] as const;
export const miniKickersSoccerSkillFocuses = ["Ball Familiarization", "Ball Control", "Dribbling", "Passing", "Receiving", "Shooting", "Turning", "Running With the Ball", "1v1", "Goal Scoring", "Basic Defending", "Other"] as const;
export const miniKickersPhysicalMotorFocuses = ["Balance", "Coordination", "Change of Direction", "Speed / Quickness", "Jumping", "Hopping", "Skipping", "Running", "Reaction", "Hand-Eye Coordination", "Foot-Eye Coordination", "Other"] as const;
export const miniKickersSocialCognitiveFocuses = ["Listening", "Following Instructions", "Sharing", "Teamwork", "Communication", "Confidence", "Creativity", "Problem Solving", "Decision Making", "Independence", "Other"] as const;
export type LibraryArea = (typeof libraryAreas)[number];
export type DrillCategory = (typeof drillCategories)[number];
export type DrillOwnership = { scope: "personal" | "club" | "department"; ownerId: string | null; organizationId: string | null; departmentId: string | null };
export type MiniKickersTheme = { name: string; iconRef: string | null; artworkRef: string | null; description: string; ageRange: string; sessionStory: string; instructions: string };
const emptyTheme: MiniKickersTheme = { name: "", iconRef: null, artworkRef: null, description: "", ageRange: "", sessionStory: "", instructions: "" };

export type LibraryDrill = {
  id: string; name: string; description: string; coachingPoints: string; progressions: string;
  objectives: string; duration: number; playerCount: number; area: string; diagram: DrillDiagram | null;
  sessionType: (typeof sessionTypes)[number]; category: DrillCategory; ageGroups: string[]; tags: string[];
  notes: string; createdAt: string; updatedAt: string; ownership: DrillOwnership;
  /** Optional organization fields keep Build 3A records valid without destructive migration. */
  libraryArea: LibraryArea; teamIds: string[]; specialization: string; miniKickersTheme: MiniKickersTheme | null;
  developmentFocus: string[]; soccerSkillFocus: string[]; physicalMotorFocus: string[]; socialCognitiveFocus: string[];
};

export function emptyLibraryDrill(): LibraryDrill {
  const now = new Date().toISOString();
  return { id: createId(), name: "", description: "", coachingPoints: "", progressions: "", objectives: "", duration: 0, playerCount: 0, area: "", diagram: null, sessionType: sessionTypes[0], category: "Other", ageGroups: [], tags: [], notes: "", createdAt: now, updatedAt: now, ownership: { scope: "personal", ownerId: null, organizationId: null, departmentId: null }, libraryArea: "personal", teamIds: [], specialization: "", miniKickersTheme: null, developmentFocus: [], soccerSkillFocus: [], physicalMotorFocus: [], socialCognitiveFocus: [] };
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function normalize(value: Partial<LibraryDrill>): LibraryDrill {
  const blank = emptyLibraryDrill();
  return { ...blank, ...value, id: typeof value.id === "string" && value.id ? value.id : blank.id,
    name: typeof value.name === "string" ? value.name : "Untitled drill",
    category: drillCategories.includes(value.category as DrillCategory) ? value.category as DrillCategory : "Other",
    sessionType: sessionTypes.includes(value.sessionType as LibraryDrill["sessionType"]) ? value.sessionType as LibraryDrill["sessionType"] : sessionTypes[0],
    ageGroups: stringArray(value.ageGroups),
    tags: stringArray(value.tags),
    libraryArea: libraryAreas.includes(value.libraryArea as LibraryArea) ? value.libraryArea as LibraryArea : "personal",
    teamIds: Array.isArray(value.teamIds) ? value.teamIds.filter((v): v is string => typeof v === "string") : [],
    specialization: typeof value.specialization === "string" ? value.specialization : "",
    miniKickersTheme: value.miniKickersTheme && typeof value.miniKickersTheme === "object" ? { ...emptyTheme, ...value.miniKickersTheme } : null,
    developmentFocus: stringArray(value.developmentFocus),
    soccerSkillFocus: stringArray(value.soccerSkillFocus),
    physicalMotorFocus: stringArray(value.physicalMotorFocus),
    socialCognitiveFocus: stringArray(value.socialCognitiveFocus),
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
  return { id: createId(), sourceDrillId: source.id, name: source.name, duration: source.duration, playerCount: source.playerCount, area: source.area, objectives: source.objectives, description: source.description, coachingPoints: source.coachingPoints, progressions: source.progressions, notes: source.notes, diagram: source.diagram ? structuredClone(source.diagram) : null, category: source.category, sessionType: source.sessionType, ageGroups: [...source.ageGroups], tags: [...source.tags], libraryArea: source.libraryArea, teamIds: [...source.teamIds], specialization: source.specialization, miniKickersTheme: source.miniKickersTheme ? structuredClone(source.miniKickersTheme) : null, developmentFocus: [...source.developmentFocus], soccerSkillFocus: [...source.soccerSkillFocus], physicalMotorFocus: [...source.physicalMotorFocus], socialCognitiveFocus: [...source.socialCognitiveFocus] };
}
export function sessionDrillToLibrary(source: TrainingDrill): LibraryDrill {
  const drill = emptyLibraryDrill();
  return { ...drill, name: source.name, duration: source.duration, playerCount: source.playerCount, area: source.area, objectives: source.objectives, description: source.description, coachingPoints: source.coachingPoints, progressions: source.progressions, notes: source.notes, diagram: source.diagram ? structuredClone(source.diagram) : null, category: drillCategories.includes(source.category as DrillCategory) ? source.category as DrillCategory : "Other", sessionType: source.sessionType ?? sessionTypes[0], ageGroups: [...(source.ageGroups ?? [])], tags: [...(source.tags ?? [])], libraryArea: libraryAreas.includes(source.libraryArea as LibraryArea) ? source.libraryArea as LibraryArea : "personal", teamIds: [...(source.teamIds ?? [])], specialization: source.specialization ?? "", miniKickersTheme: source.miniKickersTheme && typeof source.miniKickersTheme === "object" ? { ...emptyTheme, ...(source.miniKickersTheme as Partial<MiniKickersTheme>) } : null, developmentFocus: [...(source.developmentFocus ?? [])], soccerSkillFocus: [...(source.soccerSkillFocus ?? [])], physicalMotorFocus: [...(source.physicalMotorFocus ?? [])], socialCognitiveFocus: [...(source.socialCognitiveFocus ?? [])] };
}
