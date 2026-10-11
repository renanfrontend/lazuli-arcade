import { isCastId, type CastId } from '@shared/cast/cast';
import type { MatchState } from '../domain';
import type { KeyValueStore } from './ports';

/** Storage namespace for Empilha. */
export const EMPILHA_STORE = 'empilha:v2';

export const KEYS = { match: 'match', stats: 'stats', tournament: 'tournament' } as const;

export interface Stats {
  readonly wins: number;
  readonly losses: number;
  readonly streak: number;
  readonly bestStreak: number;
  /** Tournaments won. */
  readonly titles: number;
  /** Cast members beaten at least once, in the order they were first beaten. */
  readonly beaten: readonly CastId[];
  /** Event sequence of the last match already counted, so a result is never counted twice. */
  readonly recordedSeq: number;
}

export const EMPTY_STATS: Stats = { wins: 0, losses: 0, streak: 0, bestStreak: 0, titles: 0, beaten: [], recordedSeq: 0 };

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const count = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : fallback;

/** Dependency-light reader, also used by the lobby card. */
export const loadStats = (store: KeyValueStore): Stats => {
  const raw = store.read(KEYS.stats);
  if (!isRecord(raw)) return EMPTY_STATS;
  const beaten = Array.isArray(raw.beaten) ? (raw.beaten as readonly unknown[]).filter(isCastId) : [];
  return {
    wins: count(raw.wins, 0),
    losses: count(raw.losses, 0),
    streak: count(raw.streak, 0),
    bestStreak: count(raw.bestStreak, 0),
    titles: count(raw.titles, 0),
    beaten: [...new Set(beaten)],
    recordedSeq: count(raw.recordedSeq, 0),
  };
};

/** Folds a finished match into the stats exactly once. */
export const recordResult = (stats: Stats, match: MatchState): Stats => {
  if (match.status === 'playing' || match.eventSeq <= stats.recordedSeq) return stats;
  const won = match.status === 'won';
  const streak = won ? stats.streak + 1 : 0;
  return {
    ...stats,
    wins: stats.wins + (won ? 1 : 0),
    losses: stats.losses + (won ? 0 : 1),
    streak,
    bestStreak: Math.max(stats.bestStreak, streak),
    beaten: won && !stats.beaten.includes(match.opponentId) ? [...stats.beaten, match.opponentId] : stats.beaten,
    recordedSeq: match.eventSeq,
  };
};
