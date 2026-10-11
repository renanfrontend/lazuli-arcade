import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { createGameReducer, type GameConfig, type GameState, type Position } from '../domain';
import { loadGame, saveGame } from './persistence';
import type { KeyValueStore, SeedSource } from './ports';

export interface GameDeps {
  readonly config: GameConfig;
  readonly store: KeyValueStore;
  readonly seedSource: SeedSource;
}

export interface GameController {
  readonly state: GameState;
  readonly place: (pieceId: number, origin: Position) => void;
  readonly reroll: () => void;
  readonly restart: () => void;
}

/** Binds the pure game reducer to React and keeps the save file in sync. */
export const useGame = ({ config, store, seedSource }: GameDeps): GameController => {
  const reducer = useMemo(() => createGameReducer(config), [config]);
  const [state, dispatch] = useReducer(reducer, undefined, () => loadGame(store, config, seedSource));

  useEffect(() => {
    saveGame(store, state);
  }, [store, state]);

  const place = useCallback((pieceId: number, origin: Position) => {
    dispatch({ type: 'place', pieceId, origin });
  }, []);
  const reroll = useCallback(() => {
    dispatch({ type: 'reroll' });
  }, []);
  const restart = useCallback(() => {
    dispatch({ type: 'restart', seed: seedSource() });
  }, [seedSource]);

  return { state, place, reroll, restart };
};
