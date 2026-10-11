import type { KeyValueStore } from '@shared/application/ports';

export const PUGA_STORE = 'puga-salta:v1';

export const KEYS = { stats: 'stats' } as const;

export interface PugaStats {
  readonly bestHeight: number;
  readonly totalBones: number;
  readonly gamesPlayed: number;
}

export const EMPTY_PUGA_STATS: PugaStats = {
  bestHeight: 0,
  totalBones: 0,
  gamesPlayed: 0,
};

export const loadPugaStats = (store: KeyValueStore): PugaStats => {
  const raw = store.read(KEYS.stats) as Partial<PugaStats> | undefined;
  if (!raw || typeof raw !== 'object') return EMPTY_PUGA_STATS;
  return {
    bestHeight: typeof raw.bestHeight === 'number' ? Math.max(0, raw.bestHeight) : 0,
    totalBones: typeof raw.totalBones === 'number' ? Math.max(0, raw.totalBones) : 0,
    gamesPlayed: typeof raw.gamesPlayed === 'number' ? Math.max(0, raw.gamesPlayed) : 0,
  };
};

export const recordPugaGame = (store: KeyValueStore, height: number, bones: number): PugaStats => {
  const current = loadPugaStats(store);
  const updated: PugaStats = {
    bestHeight: Math.max(current.bestHeight, height),
    totalBones: current.totalBones + bones,
    gamesPlayed: current.gamesPlayed + 1,
  };
  store.write(KEYS.stats, updated);
  return updated;
};
