import { isCastId } from '@shared/cast/cast';
import { createGameStore, type GameStore } from '@shared/application/gameStore';
import type { KeyValueStore } from '@shared/application/ports';
import type { Seed } from '@shared/domain/rng';
import { initialState, memoryReducer, PAIRS, type Card, type CardFace, type MemoriaState, type MemoryAction } from '../domain/memory';

export const MEMORIA_STORE = 'memoria:v1';
const KEY = 'save';

const FACE_CODE: Readonly<Record<CardFace, string>> = { down: 'd', up: 'u', matched: 'm' };
const FACE_BY_CODE: ReadonlyMap<string, CardFace> = new Map(Object.entries(FACE_CODE).map(([face, code]) => [code, face as CardFace]));

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const count = (value: unknown): number | null =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;

const snapshot = ({ best, game }: MemoriaState) => ({
  version: 1,
  best,
  moves: game.moves,
  cards: game.cards.map((card) => `${card.cast}:${FACE_CODE[card.face]}`),
});

/** Validates a save: 16 cards, each cast member exactly twice, at most two face up. */
export const restore = (raw: unknown): MemoriaState | null => {
  if (!isRecord(raw) || raw.version !== 1 || !Array.isArray(raw.cards) || raw.cards.length !== PAIRS * 2) return null;
  const moves = count(raw.moves);
  const best = raw.best === null ? null : count(raw.best);
  if (moves === null || (best !== null && best < PAIRS)) return null;

  const cards: Card[] = [];
  for (const entry of raw.cards as readonly unknown[]) {
    if (typeof entry !== 'string') return null;
    const [cast, code] = entry.split(':');
    const face = code === undefined ? undefined : FACE_BY_CODE.get(code);
    if (!isCastId(cast) || !face) return null;
    cards.push({ cast, face });
  }
  const perCast = new Map<string, number>();
  for (const card of cards) perCast.set(card.cast, (perCast.get(card.cast) ?? 0) + 1);
  if (perCast.size !== PAIRS || [...perCast.values()].some((total) => total !== 2)) return null;
  if (cards.filter((card) => card.face === 'up').length > 2) return null;
  return { best, game: { cards, moves } };
};

export const createMemoriaStore = (store: KeyValueStore, seed: () => Seed): GameStore<MemoriaState, MemoryAction> =>
  createGameStore({ store, key: KEY, reduce: memoryReducer, initial: () => initialState(seed()), restore, snapshot });

export const loadBest = (store: KeyValueStore): number | null => restore(store.read(KEY))?.best ?? null;
