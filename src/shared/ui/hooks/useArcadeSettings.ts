import { useSyncExternalStore } from 'react';
import type { ArcadeSettings, SettingsStore } from '../../application/settings';

export const useArcadeSettings = (settings: SettingsStore): readonly [ArcadeSettings, SettingsStore['update']] => {
  const value = useSyncExternalStore(settings.subscribe, settings.get, settings.get);
  return [value, settings.update] as const;
};
