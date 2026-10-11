import { nextInt, toSeed, type Seed } from '@shared/domain/rng';

/** Segments a flask holds. */
export const CAPACITY = 4;
export const EMPTY_FLASKS = 2;
export const MAX_COLORS = 8;

/** Segment colors bottom to top, as indexes into the palette. */
export type Flask = readonly number[];
export type Flasks = readonly Flask[];

export interface FrascosGame {
  /** The arrangement the level began with, for "restart". */
  readonly start: Flasks;
  readonly flasks: Flasks;
  /** Earlier arrangements, newest last, for "undo". */
  readonly history: readonly Flasks[];
  readonly moves: number;
  readonly seed: Seed;
}

export interface FrascosState {
  readonly level: number;
  readonly game: FrascosGame;
}

export type FrascosAction =
  | { readonly type: 'pour'; readonly from: number; readonly to: number }
  | { readonly type: 'undo' }
  | { readonly type: 'restart' }
  /** A fresh puzzle of the same level. */
  | { readonly type: 'reshuffle'; readonly seed: Seed }
  /** After solving a level: the next, with one more color. */
  | { readonly type: 'nextLevel'; readonly seed: Seed };

export const colorsForLevel = (level: number): number => Math.min(MAX_COLORS, 2 + Math.max(1, Math.floor(level)));

const topRun = (flask: Flask): number => {
  const top = flask.at(-1);
  if (top === undefined) return 0;
  let run = 0;
  for (let index = flask.length - 1; index >= 0 && flask[index] === top; index -= 1) run += 1;
  return run;
};

const isUniform = (flask: Flask): boolean => flask.length > 0 && flask.every((color) => color === flask[0]);

/** How many segments would move, or 0 when the pour is not allowed. */
export const pourAmount = (flasks: Flasks, from: number, to: number): number => {
  const source = flasks[from];
  const target = flasks[to];
  if (!source || !target || from === to || source.length === 0 || target.length >= CAPACITY) return 0;
  if (target.length > 0 && target.at(-1) !== source.at(-1)) return 0;
  return Math.min(topRun(source), CAPACITY - target.length);
};

export const pour = (flasks: Flasks, from: number, to: number): Flasks | null => {
  const amount = pourAmount(flasks, from, to);
  const source = flasks[from];
  if (amount === 0 || !source) return null;
  const moved = source.slice(source.length - amount);
  return flasks.map((flask, index) => (index === from ? flask.slice(0, flask.length - amount) : index === to ? [...flask, ...moved] : flask));
};

export const isSolved = (flasks: Flasks): boolean => flasks.every((flask) => flask.length === 0 || (flask.length === CAPACITY && isUniform(flask)));

const shuffle = <T,>(items: readonly T[], seed: Seed): { items: T[]; seed: Seed } => {
  const result = [...items];
  let current = seed;
  for (let index = result.length - 1; index > 0; index -= 1) {
    const roll = nextInt(current, index + 1);
    current = roll.seed;
    const a = result[index];
    const b = result[roll.value];
    if (a !== undefined && b !== undefined) {
      result[index] = b;
      result[roll.value] = a;
    }
  }
  return { items: result, seed: current };
};

const keyOf = (flasks: Flasks): string =>
  flasks
    .map((flask) => flask.join(''))
    .sort()
    .join('|');

/** Depth-first search with a node budget: true when a solution is found within it. */
export const isSolvable = (start: Flasks, budget = 60_000): boolean => {
  const seen = new Set<string>();
  let nodes = 0;
  const visit = (flasks: Flasks): boolean => {
    if (isSolved(flasks)) return true;
    const key = keyOf(flasks);
    if (seen.has(key) || nodes >= budget) return false;
    seen.add(key);
    nodes += 1;
    const moves: { from: number; to: number; score: number }[] = [];
    flasks.forEach((source, from) => {
      flasks.forEach((target, to) => {
        const amount = pourAmount(flasks, from, to);
        // Moving a uniform flask into an empty one only swaps their roles.
        if (amount === 0 || (isUniform(source) && target.length === 0)) return;
        moves.push({ from, to, score: target.length > 0 ? 2 + amount : 0 });
      });
    });
    moves.sort((a, b) => b.score - a.score);
    return moves.some(({ from, to }) => {
      const next = pour(flasks, from, to);
      return next !== null && visit(next);
    });
  };
  return visit(start);
};

/** A shuffled puzzle that is checked to be solvable; the seed in the result is the one to carry on with. */
export const createPuzzle = (level: number, seed: Seed): { flasks: Flasks; seed: Seed } => {
  const colors = colorsForLevel(level);
  const segments = Array.from({ length: colors }, (_, color) => Array.from({ length: CAPACITY }, () => color)).flat();
  let current = toSeed(seed);
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const mixed = shuffle(segments, current);
    current = mixed.seed;
    const flasks: Flasks = [
      ...Array.from({ length: colors }, (_, index) => mixed.items.slice(index * CAPACITY, (index + 1) * CAPACITY)),
      ...Array.from({ length: EMPTY_FLASKS }, (): Flask => []),
    ];
    // Reject puzzles that are already solved or begin with a finished flask.
    if (flasks.some(isUniform)) continue;
    if (isSolvable(flasks)) return { flasks, seed: current };
  }
  // Practically unreachable: fall back to a trivially solvable arrangement.
  const sorted: Flasks = [
    ...Array.from({ length: colors }, (_, color) => Array.from({ length: CAPACITY }, () => color)),
    ...Array.from({ length: EMPTY_FLASKS }, (): Flask => []),
  ];
  return { flasks: pour(pour(sorted, 0, colors) ?? sorted, 1, colors + 1) ?? sorted, seed: current };
};

export const createGame = (level: number, seed: Seed): FrascosGame => {
  const puzzle = createPuzzle(level, seed);
  return { start: puzzle.flasks, flasks: puzzle.flasks, history: [], moves: 0, seed: puzzle.seed };
};

export const initialState = (seed: Seed, level = 1): FrascosState => ({ level, game: createGame(level, seed) });

export const frascosReducer = (state: FrascosState, action: FrascosAction): FrascosState => {
  const { game } = state;
  switch (action.type) {
    case 'pour': {
      if (isSolved(game.flasks)) return state;
      const next = pour(game.flasks, action.from, action.to);
      if (!next) return state;
      return { ...state, game: { ...game, flasks: next, history: [...game.history, game.flasks], moves: game.moves + 1 } };
    }
    case 'undo': {
      const previous = game.history.at(-1);
      if (!previous) return state;
      return { ...state, game: { ...game, flasks: previous, history: game.history.slice(0, -1), moves: Math.max(0, game.moves - 1) } };
    }
    case 'restart':
      return game.moves === 0 ? state : { ...state, game: { ...game, flasks: game.start, history: [], moves: 0 } };
    case 'reshuffle':
      return { ...state, game: createGame(state.level, action.seed) };
    case 'nextLevel':
      return isSolved(game.flasks) ? { level: state.level + 1, game: createGame(state.level + 1, action.seed) } : state;
  }
};
