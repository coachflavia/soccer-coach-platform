export const TRAINING_STORAGE_KEY = "soccer-coach-training-sessions";
export const TRAINING_DATA_EVENT = "soccer-coach-training-sessions-updated";

export const sessionTypes = ["Team / Field Training", "Goalkeeper Training", "Physical / Fitness Training", "Gym / Strength Training", "Other"] as const;
export const sessionStatuses = ["Planned", "Completed", "Canceled"] as const;
export const cancellationReasons = ["Weather", "Field Closure", "Team Conflict", "Tournament", "Coach", "Other"] as const;
export const objectiveAchievements = ["Achieved", "Partially Achieved", "Not Achieved"] as const;

export type TrainingStatus = (typeof sessionStatuses)[number];
export type TrainingReport = {
  objectiveAchievement: (typeof objectiveAchievements)[number];
  whatWentWell: string; whatCouldBeBetter: string; nextSteps: string; coachComments: string;
  followUpNeeded: boolean; followUpNotes: string; completedAt: string;
};
export type DrillDiagram = { version: number; data: unknown };
export type TrainingDrill = {
  id: string; sourceDrillId: string | null; name: string; duration: number; playerCount: number;
  area: string; objectives: string; description: string; coachingPoints: string;
  progressions: string; notes: string; diagram: DrillDiagram | null;
};
export type TrainingSession = {
  id: string; organizationId: string | null; creatorId: string | null; teamId: string;
  date: string; startTime: string; playerCount: number; plannedDuration: number;
  sessionType: (typeof sessionTypes)[number]; period: string; weather: string; temperature: string;
  mainObjective: string; mainPrinciples: string; equipment: string; generalObjectives: string;
  specificObjectives: string; notes: string; status: TrainingStatus; drills: TrainingDrill[];
  report: TrainingReport | null; cancellationReason: (typeof cancellationReasons)[number] | null;
  cancellationNotes: string; createdAt: string; updatedAt: string;
};

export function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
export function emptyDrill(): TrainingDrill {
  return { id: createId(), sourceDrillId: null, name: "", duration: 0, playerCount: 0, area: "", objectives: "", description: "", coachingPoints: "", progressions: "", notes: "", diagram: null };
}
export function emptySession(): TrainingSession {
  const now = new Date().toISOString();
  return { id: createId(), organizationId: null, creatorId: null, teamId: "", date: "", startTime: "", playerCount: 0, plannedDuration: 0, sessionType: sessionTypes[0], period: "", weather: "", temperature: "", mainObjective: "", mainPrinciples: "", equipment: "", generalObjectives: "", specificObjectives: "", notes: "", status: "Planned", drills: [], report: null, cancellationReason: null, cancellationNotes: "", createdAt: now, updatedAt: now };
}
export function parseTrainingSessions(raw: string | null): TrainingSession[] {
  if (!raw) return [];
  try { const value: unknown = JSON.parse(raw); return Array.isArray(value) ? value as TrainingSession[] : []; } catch { return []; }
}
export function saveTrainingSessions(sessions: TrainingSession[]) {
  window.localStorage.setItem(TRAINING_STORAGE_KEY, JSON.stringify(sessions));
  window.dispatchEvent(new Event(TRAINING_DATA_EVENT));
}
export function duplicateSession(source: TrainingSession): TrainingSession {
  const now = new Date().toISOString();
  return { ...source, id: createId(), mainObjective: `${source.mainObjective || "Training session"} (Copy)`, status: "Planned", report: null, cancellationReason: null, cancellationNotes: "", createdAt: now, updatedAt: now, drills: source.drills.map((drill) => ({ ...drill, id: createId(), diagram: drill.diagram ? structuredClone(drill.diagram) : null })) };
}
