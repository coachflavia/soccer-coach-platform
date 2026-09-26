export const FIXTURE_STORAGE_KEY = "soccer-coach-games-fixtures-v1";
export const ROSTER_STORAGE_KEY = "soccer-coach-games-rosters-v1";
export const GAME_PLAN_STORAGE_KEY = "soccer-coach-games-game-plans-v1";
export const GAMES_DATA_EVENT = "soccer-coach-games-updated";

export const fixtureStatuses = ["Scheduled", "Completed", "Canceled", "Postponed"] as const;
export const competitionTypes = ["League", "Cup", "Tournament", "Friendly", "Showcase", "Scrimmage", "Playoff", "Championship", "Other"] as const;
export const fieldFormats = ["4v4", "5v5", "7v7", "9v9", "11v11", "Custom"] as const;
export type FieldFormat = typeof fieldFormats[number];
export type Fixture = { id:string; teamId:string; opponentName:string; opponentLogoRef:string; competition:string; competitionType:string; stage:string; date:string; kickoffTime:string; endTime:string; arrivalTime:string; timezone:string; venue:string; field:string; address:string; homeAway:"Home"|"Away"|"Neutral"; fieldFormat:FieldFormat; customStarterCount:number|null; gameDuration:number; halfDuration:number; halftimeDuration:number; notes:string; status:string; externalCalendarEventRef:string|null; createdAt:string; updatedAt:string };
export type Roster = { id:string; fixtureId:string; teamId:string; playerIds:string[]; playerSnapshots:Array<{playerId:string;name:string;jerseyNumber:number|null}>; notes:string; meetingPointOverride:string; meetingTimeOverride:string; createdAt:string; updatedAt:string };
export type LineupSlot = { id:string; role:string; playerId:string|null; x:number; y:number };
export type GamePlan = { id:string; fixtureId:string; rosterId:string; formation:string; customFormation:string; starterCount:number; lineup:LineupSlot[]; captainPlayerId:string|null; relatedToMatch:string; relatedToOpponent:string; offensiveOrganization:string; defensiveOrganization:string; offensiveTransition:string; defensiveTransition:string; setPieces:string; matchFlow:string; emotionalAspect:string; lastWords:string; relatedToReferee:string; teamComparison:string; createdAt:string; updatedAt:string };

export const formationPresets: Record<FieldFormat,string[]> = { "4v4":["1-2-1","1-1-2"], "5v5":["1-2-2","1-1-2-1","1-3-1"], "7v7":["1-2-3-1","1-3-2-1","1-2-2-2"], "9v9":["1-3-3-2","1-3-2-3","1-2-3-3","1-2-4-2","1-3-4-1"], "11v11":["1-4-3-3","1-4-2-3-1","1-4-4-2","1-4-1-4-1","1-3-5-2","1-3-4-3","1-5-3-2"], Custom:[] };
export const standardStarterCounts: Partial<Record<FieldFormat,number>> = {"4v4":4,"5v5":5,"7v7":7,"9v9":9,"11v11":11};
export function safeCollection<T>(raw:string|null):T[]{ if(!raw)return []; try { const value:unknown=JSON.parse(raw); return Array.isArray(value)?value as T[]:[]; } catch{return [];} }
export function newId(prefix:string){return `${prefix}-${crypto.randomUUID()}`;}
export function saveCollection<T>(key:string, value:T[]){localStorage.setItem(key,JSON.stringify(value));window.dispatchEvent(new Event(GAMES_DATA_EVENT));}
export function fixtureStart(f:Fixture){return `${f.date}T${f.kickoffTime||"00:00"}`;}
export function buildSlots(formation:string):LineupSlot[]{
  const lines=formation.split("-").map(Number).filter(n=>n>0); let index=0;
  return lines.flatMap((count,line)=>Array.from({length:count},(_,i)=>({id:`slot-${index++}`,role:line===0?"Goalkeeper":`Line ${line}`,playerId:null,x:(i+1)/(count+1),y:line===0?.9:.9-(line/(Math.max(lines.length-1,1))*.75)})));
}
// Future post-match records should reference fixtureId/gamePlanId and store the result
// and player events once. Objective reviews can key into the tactical fields above.
