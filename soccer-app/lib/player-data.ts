import type { LocalImageAsset } from "./media";

export const PLAYER_STORAGE_KEY = "soccer-coach-players";
export const PLAYER_DATA_EVENT = "soccer-coach-players-updated";

export const playerTypes = ["Field Player", "Goalkeeper"] as const;
export type PlayerType = (typeof playerTypes)[number];
export type PlayerStatus = "active" | "injured" | "inactive";
export type PreferredFoot = "left" | "right" | "both";

export type PlayerProfile = {
  id: string;
  teamId: string;
  playerType: PlayerType;
  firstName: string;
  lastName: string;
  jerseyNumber: number | null;
  primaryPosition: string;
  secondaryPosition: string | null;
  dateOfBirth: string | null;
  preferredFoot: PreferredFoot | null;
  status: PlayerStatus;
  email: string | null;
  phone: string | null;
  guardianName: string | null;
  guardianEmail: string | null;
  joinedAt: string;
  notes: string;
  profilePhoto: LocalImageAsset | null;
};

export const fieldPlayerTechnicalCriteria = [
  { key: "firstTouch", label: "First Touch" },
  { key: "passing", label: "Passing" },
  { key: "receiving", label: "Receiving" },
  { key: "dribbling", label: "Dribbling" },
  { key: "ballControl", label: "Ball Control" },
  { key: "finishingShooting", label: "Finishing / Shooting" },
  { key: "crossing", label: "Crossing" },
  { key: "oneVOneAttacking", label: "1v1 Attacking" },
  { key: "oneVOneDefending", label: "1v1 Defending" },
  { key: "heading", label: "Heading" },
  { key: "weakFoot", label: "Weak Foot" },
  { key: "longPassing", label: "Long Passing" },
] as const;

export const goalkeeperTechnicalCriteria = [
  { key: "handlingCatching", label: "Handling / Catching" },
  { key: "setPosition", label: "Set Position" },
  { key: "footwork", label: "Footwork" },
  { key: "diving", label: "Diving" },
  { key: "oneVOnes", label: "1v1s" },
  { key: "distributionHands", label: "Distribution with Hands" },
  { key: "distributionFeet", label: "Distribution with Feet" },
  { key: "crossingHighBalls", label: "Crossing / High Balls" },
  { key: "shotStopping", label: "Shot Stopping" },
  { key: "reactions", label: "Reactions" },
  { key: "goalkeeperPositioning", label: "Goalkeeper Positioning" },
] as const;

export type FieldPlayerTechnicalCriterion = (typeof fieldPlayerTechnicalCriteria)[number]["key"];
export type GoalkeeperTechnicalCriterion = (typeof goalkeeperTechnicalCriteria)[number]["key"];
export type TechnicalCriterion = FieldPlayerTechnicalCriterion | GoalkeeperTechnicalCriterion;
export type TechnicalRatings = Partial<Record<TechnicalCriterion, number>>;

export type TechnicalEvaluation = {
  playerType: PlayerType;
  ratings: TechnicalRatings;
  average: number;
  notes: string;
};

export type PlayerEvaluation = {
  id: string;
  playerId: string;
  teamId: string;
  evaluatedAt: string;
  evaluator: string;
  period: string;
  technical: TechnicalEvaluation;
  strengths: string[];
  developmentPriorities: string[];
  coachNotes: string;
  nextReviewAt: string | null;
  // Future detailed categories can be added as siblings of `technical` without
  // changing player identity, evaluation history, or report composition.
  categories?: Record<string, unknown>;
};

export type PlayersData = {
  schemaVersion: 2;
  players: PlayerProfile[];
  evaluations: PlayerEvaluation[];
};

export type CriterionComparison = {
  key: TechnicalCriterion;
  label: string;
  previous: number | null;
  current: number | null;
  change: number | null;
  direction: "Improved" | "Same" | "Declined" | "Not comparable";
};

export type EvaluationComparison = {
  previousAverage: number;
  currentAverage: number;
  averageChange: number;
  criteria: CriterionComparison[];
};

export type PlayerReportData = {
  player: PlayerProfile;
  evaluations: PlayerEvaluation[];
  currentEvaluation: PlayerEvaluation | null;
  previousEvaluation: PlayerEvaluation | null;
  comparison: EvaluationComparison | null;
  technicalTrend: Array<{ evaluationId: string; date: string; average: number }>;
};

const emptyData: PlayersData = { schemaVersion: 2, players: [], evaluations: [] };

export function getTechnicalCriteria(playerType: PlayerType) {
  return playerType === "Goalkeeper"
    ? goalkeeperTechnicalCriteria
    : fieldPlayerTechnicalCriteria;
}

export function calculateTechnicalAverage(ratings: TechnicalRatings) {
  const completedRatings = Object.values(ratings).filter(
    (rating): rating is number => typeof rating === "number",
  );
  if (!completedRatings.length) return 0;
  return completedRatings.reduce((total, rating) => total + rating, 0) /
    completedRatings.length;
}

function migratePlayer(player: Omit<PlayerProfile, "playerType" | "profilePhoto"> & { playerType?: PlayerType; profilePhoto?: LocalImageAsset | null }) {
  return {
    ...player,
    playerType: player.playerType ?? (player.primaryPosition === "Goalkeeper" ? "Goalkeeper" : "Field Player"),
    profilePhoto: player.profilePhoto ?? null,
  } satisfies PlayerProfile;
}

export function parsePlayersData(raw: string | null): PlayersData {
  if (!raw) return emptyData;
  try {
    const parsed = JSON.parse(raw) as Partial<PlayersData>;
    return {
      schemaVersion: 2,
      players: Array.isArray(parsed.players) ? parsed.players.map(migratePlayer) : [],
      evaluations: Array.isArray(parsed.evaluations)
        ? parsed.evaluations.filter((evaluation) => evaluation?.technical?.ratings)
        : [],
    };
  } catch {
    return emptyData;
  }
}

export function savePlayersData(data: PlayersData) {
  window.localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event(PLAYER_DATA_EVENT));
}

export function buildEvaluationComparison(
  current: PlayerEvaluation,
  previous: PlayerEvaluation,
): EvaluationComparison {
  const criteria = getTechnicalCriteria(current.technical.playerType).map(({ key, label }) => {
    const currentRating = current.technical.ratings[key] ?? null;
    const previousRating = previous.technical.ratings[key] ?? null;
    const change = currentRating !== null && previousRating !== null
      ? currentRating - previousRating
      : null;
    return {
      key,
      label,
      previous: previousRating,
      current: currentRating,
      change,
      direction: change === null ? "Not comparable" : change > 0 ? "Improved" : change < 0 ? "Declined" : "Same",
    } satisfies CriterionComparison;
  });
  return {
    previousAverage: previous.technical.average,
    currentAverage: current.technical.average,
    averageChange: current.technical.average - previous.technical.average,
    criteria,
  };
}

export function buildPlayerReportData(
  player: PlayerProfile,
  evaluations: PlayerEvaluation[],
): PlayerReportData {
  const history = evaluations
    .filter((evaluation) => evaluation.playerId === player.id)
    .sort((a, b) => b.evaluatedAt.localeCompare(a.evaluatedAt));
  const currentEvaluation = history[0] ?? null;
  const previousEvaluation = history[1] ?? null;
  return {
    player,
    evaluations: history,
    currentEvaluation,
    previousEvaluation,
    comparison: currentEvaluation && previousEvaluation
      ? buildEvaluationComparison(currentEvaluation, previousEvaluation)
      : null,
    technicalTrend: [...history].reverse().map((evaluation) => ({
      evaluationId: evaluation.id,
      date: evaluation.evaluatedAt,
      average: evaluation.technical.average,
    })),
  };
}

export function playerFullName(player: PlayerProfile) {
  return `${player.firstName} ${player.lastName}`;
}
