import { describe, expect, it, vi } from 'vitest';
import type { KeyValueStore } from '../ports';
import { createSettingsStore, DEFAULT_ARCADE_SETTINGS } from '../settings';

const memoryStore = (initial: Record<string, unknown> = {}): KeyValueStore & { data: Map<string, unknown> } => {
  const data = new Map(Object.entries(initial));
  return { data, read: (key) => data.get(key), write: (key, value) => data.set(key, value) };
};

describe('createSettingsStore', () => {
  it('starts from the defaults and persists them', () => {
    const store = memoryStore();
    expect(createSettingsStore(store).get()).toEqual(DEFAULT_ARCADE_SETTINGS);
    expect(store.data.get('settings')).toEqual(DEFAULT_ARCADE_SETTINGS);
  });

  it('adopts a legacy value once and saves it before the old source can change', () => {
    const store = memoryStore();
    const legacy = vi.fn(() => ({ sound: false }));
    expect(createSettingsStore(store, legacy).get()).toEqual({ sound: false });
    expect(store.data.get('settings')).toEqual({ sound: false });

    // Next launch reads the saved value and never asks the legacy source again.
    legacy.mockClear();
    expect(createSettingsStore(store, legacy).get()).toEqual({ sound: false });
    expect(legacy).not.toHaveBeenCalled();
  });

  it('ignores malformed saved data', () => {
    expect(createSettingsStore(memoryStore({ settings: { sound: 'off' } })).get()).toEqual(DEFAULT_ARCADE_SETTINGS);
  });

  it('notifies subscribers only on real changes', () => {
    const store = memoryStore();
    const settings = createSettingsStore(store);
    const listener = vi.fn();
    const unsubscribe = settings.subscribe(listener);

    settings.update({ sound: true });
    expect(listener).not.toHaveBeenCalled();

    settings.update({ sound: false });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.data.get('settings')).toEqual({ sound: false });

    unsubscribe();
    settings.update({ sound: true });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
