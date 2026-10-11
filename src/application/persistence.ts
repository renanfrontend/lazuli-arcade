import { createGame, fromSnapshot, toSnapshot, type GameConfig, type GameState } from '../domain';
import type { KeyValueStore, SeedSource } from './ports';

const KEYS = { game: 'game', profile: 'profile', settings: 'settings' } as const;

export interface Profile {
  readonly best: number;
  readonly coins: number;
}

export interface Settings {
  readonly sound: boolean;
  readonly onboarded: boolean;
}

export const DEFAULT_SETTINGS: Settings = { sound: true, onboarded: false };

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const count = (value: unknown): number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0;

export const loadProfile = (store: KeyValueStore): Profile => {
  const raw = store.read(KEYS.profile);
  return isRecord(raw) ? { best: count(raw.best), coins: count(raw.coins) } : { best: 0, coins: 0 };
};

export const loadSettings = (store: KeyValueStore): Settings => {
  const raw = store.read(KEYS.settings);
  if (!isRecord(raw)) return DEFAULT_SETTINGS;
  return {
    sound: typeof raw.sound === 'boolean' ? raw.sound : DEFAULT_SETTINGS.sound,
    onboarded: typeof raw.onboarded === 'boolean' ? raw.onboarded : DEFAULT_SETTINGS.onboarded,
  };
};

export const saveSettings = (store: KeyValueStore, settings: Settings): void => {
  store.write(KEYS.settings, settings);
};

/** Resumes the saved game when it is still valid, otherwise starts a new one. */
export const loadGame = (store: KeyValueStore, config: GameConfig, seedSource: SeedSource): GameState => {
  const profile = loadProfile(store);
  const saved = fromSnapshot(store.read(KEYS.game), config);
  if (saved) return { ...saved, best: Math.max(saved.best, profile.best) };
  return createGame(config, { seed: seedSource(), best: profile.best, coins: profile.coins });
};

export const saveGame = (store: KeyValueStore, state: GameState): void => {
  store.write(KEYS.game, toSnapshot(state));
  const profile: Profile = { best: state.best, coins: state.coins };
  store.write(KEYS.profile, profile);
};
