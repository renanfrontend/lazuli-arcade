import type { AudioPort, SeedSource, StoreFactory } from './ports';
import type { SettingsStore } from './settings';

/** Everything a game receives from the arcade. Games build their own adapters on top of it. */
export interface ArcadeServices {
  readonly openStore: StoreFactory;
  readonly audio: AudioPort;
  readonly seedSource: SeedSource;
  readonly settings: SettingsStore;
}
