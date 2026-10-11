import type { KeyValueStore } from '../application/ports';

const probeLocalStorage = (namespace: string): Storage | null => {
  try {
    const storage = window.localStorage;
    const probe = `${namespace}:probe`;
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    // Private mode, blocked site data or sandboxed frames: fall back to memory.
    return null;
  }
};

/** localStorage-backed store that degrades to memory and never throws. */
export const createBrowserStore = (namespace: string): KeyValueStore => {
  const storage = probeLocalStorage(namespace);
  const memory = new Map<string, string>();
  const keyOf = (key: string) => `${namespace}:${key}`;

  return {
    read(key) {
      try {
        const raw = storage ? storage.getItem(keyOf(key)) : (memory.get(keyOf(key)) ?? null);
        return raw === null ? undefined : (JSON.parse(raw) as unknown);
      } catch {
        return undefined;
      }
    },
    write(key, value) {
      const raw = JSON.stringify(value);
      try {
        if (storage) storage.setItem(keyOf(key), raw);
        else memory.set(keyOf(key), raw);
      } catch {
        memory.set(keyOf(key), raw);
      }
    },
  };
};
