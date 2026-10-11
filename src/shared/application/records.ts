import type { KeyValueStore } from './ports';

export interface ArcadeRecord { readonly best: number; readonly games: number }

const count = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

export const readRecord = (store: KeyValueStore): ArcadeRecord => {
  const raw = store.read('record');
  if (typeof raw !== 'object' || raw === null) return { best: 0, games: 0 };
  return { best: count('best' in raw ? raw.best : 0), games: count('games' in raw ? raw.games : 0) };
};

export const saveRecord = (store: KeyValueStore, score: number): ArcadeRecord => {
  const previous = readRecord(store);
  const record = { best: Math.max(previous.best, count(score)), games: previous.games + 1 };
  store.write('record', record);
  return record;
};
