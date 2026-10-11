import {
  createMatch,
  createMatchReducer,
  fromSnapshot,
  toSnapshot,
  type MatchAction,
  type MatchState,
  type Rules,
} from '../domain';
import type { KeyValueStore, SeedSource } from './ports';
import { KEYS, loadStats, recordResult, type Stats } from './stats';

export interface MatchSession {
  readonly match: MatchState;
  readonly stats: Stats;
}

/**
 * Observable owner of the match. `dispatch` returns the next session synchronously, so input
 * handlers and the opponent's timer can react to exactly what their own action produced.
 * Every change is saved, and a finished match is folded into the stats in the same step.
 */
export interface MatchStore {
  readonly getState: () => MatchSession;
  readonly subscribe: (listener: () => void) => () => void;
  readonly dispatch: (action: MatchAction) => MatchSession;
}

export interface MatchStoreDeps {
  readonly rules: Rules;
  readonly store: KeyValueStore;
  readonly seedSource: SeedSource;
}

export const loadSession = ({ rules, store, seedSource }: MatchStoreDeps): MatchSession => {
  const stats = loadStats(store);
  const saved = fromSnapshot(store.read(KEYS.match), rules);
  const match = saved ?? createMatch(rules, { level: stats.level, seed: seedSource(), eventSeq: stats.recordedSeq });
  return { match, stats: recordResult(stats, match) };
};

const save = (store: KeyValueStore, session: MatchSession): void => {
  store.write(KEYS.match, toSnapshot(session.match));
  store.write(KEYS.stats, session.stats);
};

export const createMatchStore = (deps: MatchStoreDeps): MatchStore => {
  const reduce = createMatchReducer(deps.rules);
  let session = loadSession(deps);
  save(deps.store, session);
  const listeners = new Set<() => void>();

  return {
    getState: () => session,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispatch(action) {
      const match = reduce(session.match, action);
      if (match === session.match) return session;
      session = { match, stats: recordResult(session.stats, match) };
      save(deps.store, session);
      for (const listener of listeners) listener();
      return session;
    },
  };
};
