import { createGameStore, type GameStore } from '@shared/application/gameStore';
import type { KeyValueStore } from '@shared/application/ports';
import type { Seed } from '@shared/domain/rng';
import { CAPACITY, colorsForLevel, EMPTY_FLASKS, frascosReducer, initialState, type FrascosAction, type FrascosState, type Flasks } from '../domain/frascos';

export const FRASCOS_STORE = 'frascos:v1';
const KEY = 'save';
const MAX_HISTORY = 500;

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const count = (value: unknown): number | null =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;

const encode = (flasks: Flasks): string[] => flasks.map((flask) => flask.join(''));

const snapshot = ({ level, game }: FrascosState) => ({
  version: 1,
  level,
  seed: game.seed,
  moves: game.moves,
  start: encode(game.start),
  flasks: encode(game.flasks),
  history: game.history.slice(-MAX_HISTORY).map(encode),
});

/** Flasks of a level: the right number, each color exactly CAPACITY times, none overfilled. */
const decodeFlasks = (raw: unknown, colors: number): Flasks | null => {
  if (!Array.isArray(raw) || raw.length !== colors + EMPTY_FLASKS) return null;
  const flasks: number[][] = [];
  for (const entry of raw as readonly unknown[]) {
    if (typeof entry !== 'string' || entry.length > CAPACITY || !/^\d*$/.test(entry)) return null;
    const flask = Array.from(entry, Number);
    if (flask.some((color) => color >= colors)) return null;
    flasks.push(flask);
  }
  const totals = new Array<number>(colors).fill(0);
  for (const color of flasks.flat()) totals[color] = (totals[color] ?? 0) + 1;
  return totals.every((total) => total === CAPACITY) ? flasks : null;
};

export const restore = (raw: unknown): FrascosState | null => {
  if (!isRecord(raw) || raw.version !== 1) return null;
  const level = count(raw.level);
  const seed = count(raw.seed);
  const moves = count(raw.moves);
  if (level === null || level < 1 || seed === null || seed > 0xffffffff || moves === null) return null;
  const colors = colorsForLevel(level);
  const start = decodeFlasks(raw.start, colors);
  const flasks = decodeFlasks(raw.flasks, colors);
  if (!start || !flasks || !Array.isArray(raw.history) || raw.history.length > MAX_HISTORY) return null;
  const history: Flasks[] = [];
  for (const entry of raw.history as readonly unknown[]) {
    const decoded = decodeFlasks(entry, colors);
    if (!decoded) return null;
    history.push(decoded);
  }
  return { level, game: { start, flasks, history, moves, seed } };
};

export const createFrascosStore = (store: KeyValueStore, seed: () => Seed): GameStore<FrascosState, FrascosAction> =>
  createGameStore({ store, key: KEY, reduce: frascosReducer, initial: () => initialState(seed()), restore, snapshot });

export const loadLevel = (store: KeyValueStore): number => restore(store.read(KEY))?.level ?? 1;
