import type { KeyValueStore } from './ports';

/** Preferences that apply to the whole arcade, not to a single game. */
export interface ArcadeSettings {
  readonly sound: boolean;
}

export const DEFAULT_ARCADE_SETTINGS: ArcadeSettings = { sound: true };

export interface SettingsStore {
  readonly get: () => ArcadeSettings;
  readonly update: (patch: Partial<ArcadeSettings>) => void;
  readonly subscribe: (listener: () => void) => () => void;
}

const KEY = 'settings';

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const parse = (raw: unknown): ArcadeSettings | null =>
  isRecord(raw) && typeof raw.sound === 'boolean' ? { sound: raw.sound } : null;

/**
 * Observable settings backed by a KeyValueStore. `legacy` supplies a value saved
 * by an older version (the first game kept its own sound toggle) so nobody
 * gets their sound turned back on by the move to a shared setting.
 */
export const createSettingsStore = (store: KeyValueStore, legacy?: () => Partial<ArcadeSettings>): SettingsStore => {
  const saved = parse(store.read(KEY));
  let current: ArcadeSettings = saved ?? { ...DEFAULT_ARCADE_SETTINGS, ...legacy?.() };
  // Persist a migrated value right away: the old source may be rewritten later.
  if (!saved) store.write(KEY, current);
  const listeners = new Set<() => void>();

  return {
    get: () => current,
    update(patch) {
      const next = { ...current, ...patch };
      if (next.sound === current.sound) return;
      current = next;
      store.write(KEY, current);
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};
