import type { Seed } from '@shared/domain/rng';
import {
  createTournament,
  nextRival,
  recordPlayerResult,
  statusOf,
  type MatchState,
  type Rules,
  type Tournament,
  type TournamentStatus,
} from '../domain';
import type { KeyValueStore } from './ports';
import { KEYS } from './stats';

/** What is persisted: the bracket is rebuilt by replaying the player's results on the seed. */
export interface TournamentSave {
  readonly seed: Seed;
  readonly results: readonly boolean[];
  /** Event sequence of the match started from the bracket, so a quick match is never counted. */
  readonly matchSeq: number | null;
  readonly recordedSeq: number;
}

export interface TournamentSession {
  readonly save: TournamentSave;
  readonly tournament: Tournament;
  readonly status: TournamentStatus;
}

export interface TournamentStore {
  readonly getState: () => TournamentSession | null;
  readonly subscribe: (listener: () => void) => () => void;
  /** Starts a fresh bracket, replacing any other. */
  readonly start: (seed: Seed) => TournamentSession;
  /** Marks `seq` as the bracket match now being played. */
  readonly beginMatch: (seq: number) => void;
  /** Counts a finished bracket match once; returns true when it just made the player champion. */
  readonly settle: (match: MatchState) => boolean;
  readonly abandon: () => void;
}

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const count = (value: unknown): number | null =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;

const rebuild = (rules: Rules, save: TournamentSave): TournamentSession | null => {
  let tournament = createTournament(rules, save.seed);
  for (const won of save.results) {
    if (statusOf(tournament) !== 'playing') return null;
    tournament = recordPlayerResult(rules, tournament, won);
  }
  return { save, tournament, status: statusOf(tournament) };
};

export const loadTournament = (store: KeyValueStore, rules: Rules): TournamentSession | null => {
  const raw = store.read(KEYS.tournament);
  if (!isRecord(raw)) return null;
  const seed = count(raw.seed);
  const recordedSeq = count(raw.recordedSeq);
  const matchSeq = raw.matchSeq === null ? null : count(raw.matchSeq);
  if (seed === null || seed > 0xffffffff || recordedSeq === null) return null;
  if (!Array.isArray(raw.results) || raw.results.length > 3 || !(raw.results as readonly unknown[]).every((value) => typeof value === 'boolean')) return null;
  return rebuild(rules, { seed, results: raw.results as readonly boolean[], matchSeq, recordedSeq });
};

export const createTournamentStore = (store: KeyValueStore, rules: Rules): TournamentStore => {
  let session = loadTournament(store, rules);
  const listeners = new Set<() => void>();

  const commit = (next: TournamentSession | null) => {
    session = next;
    store.write(KEYS.tournament, next?.save ?? null);
    for (const listener of listeners) listener();
  };

  return {
    getState: () => session,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    start(seed) {
      const next = rebuild(rules, { seed, results: [], matchSeq: null, recordedSeq: 0 });
      if (!next) throw new RangeError('A new tournament must always be playable');
      commit(next);
      return next;
    },
    beginMatch(seq) {
      if (session?.status !== 'playing') return;
      commit({ ...session, save: { ...session.save, matchSeq: seq } });
    },
    settle(match) {
      if (session?.status !== 'playing' || match.status === 'playing') return false;
      const { save, tournament } = session;
      if (save.matchSeq !== match.eventSeq || save.recordedSeq >= match.eventSeq) return false;
      // Only the match against the rival the bracket is waiting for counts.
      if (nextRival(tournament) !== match.opponentId) return false;
      const next = rebuild(rules, { ...save, results: [...save.results, match.status === 'won'], recordedSeq: match.eventSeq });
      if (!next) return false;
      commit(next);
      return next.status === 'champion';
    },
    abandon() {
      commit(null);
    },
  };
};
