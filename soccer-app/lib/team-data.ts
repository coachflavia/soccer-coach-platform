import type { LocalImageAsset } from "./media";

export const TEAM_STORAGE_KEY = "soccer-coach-teams";
export const TEAM_DATA_EVENT = "soccer-coach-teams-updated";

export type TeamBranding = { logo: LocalImageAsset | null };

export type Team = {
  id: string;
  name: string;
  ageGroup: string;
  gender: string;
  teamType: string;
  club: string;
  season: string;
  branding: TeamBranding;
};

type StoredTeam = Omit<Team, "branding"> & { branding?: Partial<TeamBranding>; logo?: LocalImageAsset };

function migrateTeam(team: StoredTeam): Team {
  return { ...team, branding: { logo: team.branding?.logo ?? team.logo ?? null } };
}

export function parseTeams(raw: string | null): Team[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredTeam[]).map(migrateTeam) : [];
  } catch {
    return [];
  }
}

export function saveTeams(teams: Team[]) {
  window.localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(teams));
  window.dispatchEvent(new Event(TEAM_DATA_EVENT));
}
