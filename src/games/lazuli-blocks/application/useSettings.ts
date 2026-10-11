import { useCallback, useEffect, useState } from 'react';
import { loadSettings, saveSettings, type Settings } from './persistence';
import type { KeyValueStore } from './ports';

export const useSettings = (store: KeyValueStore) => {
  const [settings, setSettings] = useState<Settings>(() => loadSettings(store));

  useEffect(() => {
    saveSettings(store, settings);
  }, [store, settings]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  return [settings, update] as const;
};
