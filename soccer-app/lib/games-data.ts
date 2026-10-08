export const FIXTURE_STORAGE_KEY = "soccer-coach-games-fixtures-v1";
export const ROSTER_STORAGE_KEY = "soccer-coach-games-rosters-v1";
export const GAME_PLAN_STORAGE_KEY = "soccer-coach-games-game-plans-v1";
export const LIVE_MATCH_STORAGE_KEY = "soccer-coach-games-live-matches-v1";
export const POST_MATCH_STORAGE_KEY = "soccer-coach-games-post-match-v1";
export const GAMES_DATA_EVENT = "soccer-coach-games-updated";

export const fixtureStatuses = ["Scheduled", "Completed", "Canceled", "Postponed"] as const;
export const competitionTypes = ["League", "Cup", "Tournament", "Friendly", "Showcase", "Scrimmage", "Playoff", "Championship", "Other"] as const;
export const fieldFormats = ["4v4", "5v5", "7v7", "9v9", "11v11", "Custom"] as const;
export type FieldFormat = typeof fieldFormats[number];
export type Fixture = { id:string; teamId:string; opponentName:string; opponentLogoRef:string; competition:string; competitionType:string; stage:string; date:string; kickoffTime:string; endTime:string; arrivalTime:string; timezone:string; venue:string; field:string; address:string; homeAway:"Home"|"Away"|"Neutral"; fieldFormat:FieldFormat; customStarterCount:number|null; gameDuration:number; halfDuration:number; halftimeDuration:number; notes:string; status:string; externalCalendarEventRef:string|null; createdAt:string; updatedAt:string };
export type Roster = { id:string; fixtureId:string; teamId:string; playerIds:string[]; playerSnapshots:Array<{playerId:string;name:string;jerseyNumber:number|null}>; notes:string; meetingPointOverride:string; meetingTimeOverride:string; createdAt:string; updatedAt:string };
export type LineupSlot = { id:string; role:string; playerId:string|null; x:number; y:number };
export type GamePlan = { id:string; fixtureId:string; rosterId:string; formation:string; customFormation:string; starterCount:number; lineup:LineupSlot[]; captainPlayerId:string|null; relatedToMatch:string; relatedToOpponent:string; offensiveOrganization:string; defensiveOrganization:string; offensiveTransition:string; defensiveTransition:string; setPieces:string; matchFlow:string; emotionalAspect:string; lastWords:string; relatedToReferee:string; teamComparison:string; createdAt:string; updatedAt:string };

export type MatchPhase="NOT_STARTED"|"FIRST_HALF"|"HALFTIME"|"SECOND_HALF"|"FULL_TIME";
export type MatchSide="US"|"OPPONENT";
export type MatchEventType="MATCH_STARTED"|"GOAL"|"ASSIST"|"SUBSTITUTION"|"POSITION_CHANGE"|"YELLOW_CARD"|"RED_CARD"|"SHOT"|"SHOT_ON_TARGET"|"CORNER"|"FOUL"|"OFFSIDE"|"END_FIRST_HALF"|"START_SECOND_HALF"|"FULL_TIME";
export type MatchEvent={id:string;liveMatchId:string;type:MatchEventType;side?:MatchSide;playerId?:string;assistPlayerId?:string;playerOutId?:string;playerInId?:string;phase:MatchPhase;matchSecond:number;occurredAt:string;order:number;metadata?:Record<string,string|number|boolean|null>};
export type PlayerMatchState={playerId:string;started:boolean;onField:boolean;slotId:string|null;positionHistory:string[];playedSeconds:number;benchSeconds:number;stintStartedAt:string|null;benchStintStartedAt:string|null};
export type LiveMatch={schemaVersion:1;id:string;fixtureId:string;rosterId:string;gamePlanId:string|null;phase:MatchPhase;paused:boolean;elapsedSeconds:number;clockStartedAt:string|null;players:PlayerMatchState[];events:MatchEvent[];activeFormation?:string;liveSlots?:LineupSlot[];createdAt:string;updatedAt:string};
export type TeamMatchStats={goals:number;shots:number;shotsOnTarget:number;corners:number;fouls:number;offsides:number};
export type PlayerMatchCorrection={playerId:string;minutesPlayed:number|null;positions:string[];goalsAgainst:number|null};
export type TacticalAssessment=""|"ACHIEVED"|"PARTIALLY_ACHIEVED"|"NOT_ACHIEVED";
export type TacticalReview={key:string;assessment:TacticalAssessment;notes:string};
export type PostMatchReport={schemaVersion:1;id:string;fixtureId:string;rosterId:string;gamePlanId:string|null;liveMatchId:string|null;status:"DRAFT"|"COMPLETED";teamStats:{US:TeamMatchStats;OPPONENT:TeamMatchStats};playerCorrections:PlayerMatchCorrection[];tacticalReviews:TacticalReview[];coachSummary:string;wentWell:string;couldBeBetter:string;keyTakeaways:string;needsTrainingFollowUp:boolean;trainingFollowUpNotes:string;generalComments:string;createdAt:string;updatedAt:string;completedAt:string|null};

export const formationPresets: Record<FieldFormat,string[]> = { "4v4":["1-2-1","1-1-2"], "5v5":["1-2-2","1-1-2-1","1-3-1"], "7v7":["1-2-3-1","1-3-2-1","1-2-2-2"], "9v9":["1-3-3-2","1-3-2-3","1-2-3-3","1-2-4-2","1-3-4-1"], "11v11":["1-4-3-3","1-4-2-3-1","1-4-4-2","1-4-1-4-1","1-3-5-2","1-3-4-3","1-5-3-2"], Custom:[] };
export const standardStarterCounts: Partial<Record<FieldFormat,number>> = {"4v4":4,"5v5":5,"7v7":7,"9v9":9,"11v11":11};
export function safeCollection<T>(raw:string|null):T[]{ if(!raw)return []; try { const value:unknown=JSON.parse(raw); return Array.isArray(value)?value as T[]:[]; } catch{return [];} }
export function newId(prefix:string){return `${prefix}-${crypto.randomUUID()}`;}
export function saveCollection<T>(key:string, value:T[]){localStorage.setItem(key,JSON.stringify(value));window.dispatchEvent(new Event(GAMES_DATA_EVENT));}
export function activeMatch(phase:MatchPhase,paused:boolean){return !paused&&(phase==="FIRST_HALF"||phase==="SECOND_HALF");}
export function secondsSince(iso:string|null,now=Date.now()){return iso?Math.max(0,Math.floor((now-new Date(iso).getTime())/1000)):0;}
export function matchSeconds(match:LiveMatch,now=Date.now()){return match.elapsedSeconds+(activeMatch(match.phase,match.paused)?secondsSince(match.clockStartedAt,now):0);}
export function playerTimes(player:PlayerMatchState,match:LiveMatch,now=Date.now()){const running=activeMatch(match.phase,match.paused);return{played:player.playedSeconds+(running&&player.onField?secondsSince(player.stintStartedAt,now):0),bench:player.benchSeconds+(running&&!player.onField?secondsSince(player.benchStintStartedAt,now):0),currentBench:running&&!player.onField?secondsSince(player.benchStintStartedAt,now):0}};
export function deriveTeamStats(events:MatchEvent[]):{US:TeamMatchStats;OPPONENT:TeamMatchStats}{const blank=():TeamMatchStats=>({goals:0,shots:0,shotsOnTarget:0,corners:0,fouls:0,offsides:0}),result={US:blank(),OPPONENT:blank()};for(const e of events){if(!e.side)continue;const s=result[e.side];if(e.type==="GOAL"){s.goals++;s.shots++;s.shotsOnTarget++;}else if(e.type==="SHOT")s.shots++;else if(e.type==="SHOT_ON_TARGET"){s.shots++;s.shotsOnTarget++;}else if(e.type==="CORNER")s.corners++;else if(e.type==="FOUL")s.fouls++;else if(e.type==="OFFSIDE")s.offsides++;}return result;}
export function countPlayerAssists(events:MatchEvent[],playerId:string){const attached=events.filter(e=>e.type==="GOAL"&&e.assistPlayerId===playerId),unmatched=[...attached];let standaloneCount=0;for(const assist of events.filter(e=>e.type==="ASSIST"&&e.playerId===playerId)){const duplicate=unmatched.findIndex(goal=>goal.phase===assist.phase&&Math.abs(goal.matchSecond-assist.matchSecond)<=10);if(duplicate>=0)unmatched.splice(duplicate,1);else standaloneCount++;}return attached.length+standaloneCount;}
export function fixtureStart(f:Fixture){return `${f.date}T${f.kickoffTime||"00:00"}`;}
export function buildSlots(formation:string):LineupSlot[]{
  const lines=formation.split("-").map(Number).filter(n=>n>0); let index=0;
  return lines.flatMap((count,line)=>Array.from({length:count},(_,i)=>({id:`slot-${index++}`,role:line===0?"Goalkeeper":`Line ${line}`,playerId:null,x:(i+1)/(count+1),y:line===0?.9:.9-(line/(Math.max(lines.length-1,1))*.75)})));
}
// Future post-match records should reference fixtureId/gamePlanId and store the result
// and player events once. Objective reviews can key into the tactical fields above.
