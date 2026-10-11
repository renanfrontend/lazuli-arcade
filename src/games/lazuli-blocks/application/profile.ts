import type { KeyValueStore } from './ports';

/** Storage namespace; unchanged since the single-game version so existing saves keep working. */
export const LAZULI_STORE = 'lazuli-blocks:v1';

export const KEYS = { game: 'game', profile: 'profile', settings: 'settings' } as const;

export interface Profile {
  readonly best: number;
  readonly coins: number;
}

export const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const count = (value: unknown): number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0;

/** Best score and wallet; dependency-free so the lobby can read it without loading the game. */
export const loadProfile = (store: KeyValueStore): Profile => {
  const raw = store.read(KEYS.profile);
  return isRecord(raw) ? { best: count(raw.best), coins: count(raw.coins) } : { best: 0, coins: 0 };
};

/** Sound used to be a per-game toggle; the arcade reads it once to seed its shared setting. */
export const readLegacySound = (store: KeyValueStore): boolean | undefined => {
  const raw = store.read(KEYS.settings);
  return isRecord(raw) && typeof raw.sound === 'boolean' ? raw.sound : undefined;
};
