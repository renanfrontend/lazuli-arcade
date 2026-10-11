import type { KeyValueStore } from './ports';

export interface GameStore<TState, TAction> {
  readonly getState: () => TState;
  readonly subscribe: (listener: () => void) => () => void;
  /** Applies the action, saves, notifies, and returns the new state synchronously. */
  readonly dispatch: (action: TAction) => TState;
}

interface GameStoreOptions<TState, TAction> {
  readonly store: KeyValueStore;
  readonly key: string;
  readonly reduce: (state: TState, action: TAction) => TState;
  /** A fresh state, used when nothing valid is saved. */
  readonly initial: () => TState;
  /** Validates untrusted saved data; null means "start over". */
  readonly restore: (raw: unknown) => TState | null;
  /** JSON-safe form of the state. */
  readonly snapshot: (state: TState) => unknown;
}

/**
 * Observable, persisted reducer for small games. Plugs into `useSyncExternalStore`; a save that
 * fails validation is ignored instead of breaking the game.
 */
export const createGameStore = <TState, TAction>({
  store,
  key,
  reduce,
  initial,
  restore,
  snapshot,
}: GameStoreOptions<TState, TAction>): GameStore<TState, TAction> => {
  let state = restore(store.read(key)) ?? initial();
  const listeners = new Set<() => void>();
  store.write(key, snapshot(state));

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispatch(action) {
      const next = reduce(state, action);
      if (next === state) return state;
      state = next;
      store.write(key, snapshot(state));
      for (const listener of listeners) listener();
      return state;
    },
  };
};
