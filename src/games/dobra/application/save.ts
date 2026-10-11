import { createGameStore, type GameStore } from '@shared/application/gameStore';
import type { KeyValueStore } from '@shared/application/ports';
import type { Seed } from '@shared/domain/rng';
import { canMove, dobraReducer, initialState, SIZE, type DobraAction, type DobraState, type Status, type Tile } from '../domain/dobra';

export const DOBRA_STORE = 'dobra:v1';
const KEY = 'save';
const MAX_LEVEL = 16;
const STATUSES: readonly Status[] = ['playing', 'won', 'lost'];

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const count = (value: unknown): number | null =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;

const snapshot = ({ best, game }: DobraState) => ({
  version: 1,
  best,
  score: game.score,
  moves: game.moves,
  status: game.status,
  keepGoing: game.keepGoing,
  seed: game.seed,
  nextId: game.nextId,
  tiles: game.tiles.map((tile) => [tile.id, tile.col, tile.row, tile.level]),
});

const decodeTile = (entry: unknown): Tile | null => {
  if (!Array.isArray(entry) || entry.length !== 4) return null;
  const [id, col, row, level] = (entry as readonly unknown[]).map(count);
  if (id === null || col === null || row === null || level === null || id === undefined) return null;
  if (col === undefined || row === undefined || level === undefined) return null;
  if (col >= SIZE || row >= SIZE || level < 1 || level > MAX_LEVEL) return null;
  return { id, col, row, level, born: false, merged: false };
};

/** Validates a save: tiles inside the board, no overlaps, a status that matches the position. */
export const restore = (raw: unknown): DobraState | null => {
  if (!isRecord(raw) || raw.version !== 1 || !Array.isArray(raw.tiles) || raw.tiles.length > SIZE * SIZE) return null;
  const best = count(raw.best);
  const score = count(raw.score);
  const moves = count(raw.moves);
  const seed = count(raw.seed);
  const nextId = count(raw.nextId);
  const status = STATUSES.find((value) => value === raw.status);
  if (best === null || score === null || moves === null || seed === null || seed > 0xffffffff || nextId === null || !status) return null;
  if (typeof raw.keepGoing !== 'boolean') return null;

  const tiles: Tile[] = [];
  for (const entry of raw.tiles as readonly unknown[]) {
    const tile = decodeTile(entry);
    if (!tile || tile.id >= nextId) return null;
    tiles.push(tile);
  }
  const places = new Set(tiles.map((tile) => `${tile.col},${tile.row}`));
  if (places.size !== tiles.length || new Set(tiles.map((tile) => tile.id)).size !== tiles.length) return null;
  if (tiles.length === 0 || (status === 'playing') !== canMove(tiles) && status !== 'won') return null;
  return { best: Math.max(best, score), game: { tiles, score, moves, status, keepGoing: raw.keepGoing, seed, nextId } };
};

export const createDobraStore = (store: KeyValueStore, seed: () => Seed): GameStore<DobraState, DobraAction> =>
  createGameStore({ store, key: KEY, reduce: dobraReducer, initial: () => initialState(seed()), restore, snapshot });

export const loadBest = (store: KeyValueStore): number => restore(store.read(KEY))?.best ?? 0;
