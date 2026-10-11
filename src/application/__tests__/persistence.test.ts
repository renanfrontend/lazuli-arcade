import { describe, expect, it } from 'vitest';
import { createGameReducer, DEFAULT_CONFIG, validOrigins } from '../../domain';
import { DEFAULT_SETTINGS, loadGame, loadProfile, loadSettings, saveGame, saveSettings } from '../persistence';
import type { KeyValueStore } from '../ports';

const memoryStore = (seed: Record<string, unknown> = {}): KeyValueStore & { dump: () => Record<string, unknown> } => {
  const data = new Map<string, string>(Object.entries(seed).map(([key, value]) => [key, JSON.stringify(value)]));
  return {
    read: (key) => {
      const raw = data.get(key);
      return raw === undefined ? undefined : (JSON.parse(raw) as unknown);
    },
    write: (key, value) => {
      data.set(key, JSON.stringify(value));
    },
    dump: () => Object.fromEntries([...data].map(([key, raw]) => [key, JSON.parse(raw) as unknown])),
  };
};

const fixedSeed = () => 2468;

describe('persistence', () => {
  it('starts a new game from the stored profile when there is no save', () => {
    const store = memoryStore({ profile: { best: 5200, coins: 45 } });
    const state = loadGame(store, DEFAULT_CONFIG, fixedSeed);
    expect(state).toMatchObject({ best: 5200, coins: 45, score: 0, moves: 0 });
  });

  it('resumes a saved game exactly where it stopped', () => {
    const store = memoryStore();
    const reduce = createGameReducer(DEFAULT_CONFIG);
    let state = loadGame(store, DEFAULT_CONFIG, fixedSeed);
    const piece = state.tray.find((slot) => slot !== null);
    const origin = piece ? validOrigins(state.board, piece.shape).next().value : undefined;
    if (!piece || !origin) throw new Error('fixture needs a move');
    state = reduce(state, { type: 'place', pieceId: piece.id, origin });
    saveGame(store, state);

    const resumed = loadGame(store, DEFAULT_CONFIG, () => 1);
    expect(resumed).toEqual({ ...state, lastEvent: null });
    expect(loadProfile(store)).toEqual({ best: state.best, coins: state.coins });
  });

  it('falls back to a fresh game when the save is corrupted', () => {
    const store = memoryStore({ game: { version: 1, board: 'broken' }, profile: { best: 10, coins: 3 } });
    expect(loadGame(store, DEFAULT_CONFIG, fixedSeed)).toMatchObject({ moves: 0, best: 10, coins: 3 });
  });

  it('sanitizes settings', () => {
    expect(loadSettings(memoryStore())).toEqual(DEFAULT_SETTINGS);
    expect(loadSettings(memoryStore({ settings: { sound: 'yes', onboarded: true } }))).toEqual({
      sound: true,
      onboarded: true,
    });
    const store = memoryStore();
    saveSettings(store, { sound: false, onboarded: true });
    expect(loadSettings(store)).toEqual({ sound: false, onboarded: true });
  });
});
