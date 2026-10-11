import type { MatchState } from '../domain';
import type { KeyValueStore } from './ports';

/** Storage namespace for Empilha. */
export const EMPILHA_STORE = 'empilha:v1';

export const KEYS = { match: 'match', stats: 'stats' } as const;

export interface Stats {
  /** Level of the next match: a win moves it up, a loss keeps it. */
  readonly level: number;
  readonly wins: number;
  readonly losses: number;
  readonly streak: number;
  readonly bestStreak: number;
  /** Event sequence of the last match already counted, so a result is never counted twice. */
  readonly recordedSeq: number;
}

export const EMPTY_STATS: Stats = { level: 1, wins: 0, losses: 0, streak: 0, bestStreak: 0, recordedSeq: 0 };

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const count = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : fallback;

/** Dependency-light reader, also used by the lobby card. */
export const loadStats = (store: KeyValueStore): Stats => {
  const raw = store.read(KEYS.stats);
  if (!isRecord(raw)) return EMPTY_STATS;
  return {
    level: Math.max(1, count(raw.level, 1)),
    wins: count(raw.wins, 0),
    losses: count(raw.losses, 0),
    streak: count(raw.streak, 0),
    bestStreak: count(raw.bestStreak, 0),
    recordedSeq: count(raw.recordedSeq, 0),
  };
};

/** Folds a finished match into the stats exactly once. */
export const recordResult = (stats: Stats, match: MatchState): Stats => {
  if (match.status === 'playing' || match.eventSeq <= stats.recordedSeq) return stats;
  const won = match.status === 'won';
  const streak = won ? stats.streak + 1 : 0;
  return {
    level: won ? Math.max(stats.level, match.level + 1) : stats.level,
    wins: stats.wins + (won ? 1 : 0),
    losses: stats.losses + (won ? 0 : 1),
    streak,
    bestStreak: Math.max(stats.bestStreak, streak),
    recordedSeq: match.eventSeq,
  };
};
