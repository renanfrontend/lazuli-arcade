import { nextFloat, nextInt, toSeed, type Seed } from '@shared/domain/rng';

export const SIZE = 4;
/** A tile of level n is worth 2^n; reaching this level wins the game. */
export const WIN_LEVEL = 11;

export type Direction = 'left' | 'right' | 'up' | 'down';

export interface Tile {
  /** Stable while the tile slides, so the screen can animate it. */
  readonly id: number;
  readonly col: number;
  readonly row: number;
  readonly level: number;
  /** Appeared this move. */
  readonly born: boolean;
  /** Absorbed an equal tile this move. */
  readonly merged: boolean;
}

export type Status = 'playing' | 'won' | 'lost';

export interface DobraGame {
  readonly tiles: readonly Tile[];
  readonly score: number;
  readonly moves: number;
  readonly status: Status;
  /** The player chose to carry on after reaching the winning tile. */
  readonly keepGoing: boolean;
  readonly seed: Seed;
  readonly nextId: number;
}

export interface DobraState {
  readonly best: number;
  readonly game: DobraGame;
}

export type DobraAction =
  | { readonly type: 'move'; readonly direction: Direction }
  | { readonly type: 'continue' }
  | { readonly type: 'newGame'; readonly seed: Seed };

export const valueOf = (level: number): number => 2 ** level;

const cellKey = (col: number, row: number) => row * SIZE + col;

const occupied = (tiles: readonly Tile[]): ReadonlySet<number> => new Set(tiles.map((tile) => cellKey(tile.col, tile.row)));

/** Adds one tile (2 nine times in ten, otherwise 4) on a random empty cell. */
const spawn = (game: Pick<DobraGame, 'tiles' | 'seed' | 'nextId'>): Pick<DobraGame, 'tiles' | 'seed' | 'nextId'> => {
  const taken = occupied(game.tiles);
  const empty = Array.from({ length: SIZE * SIZE }, (_, key) => key).filter((key) => !taken.has(key));
  if (empty.length === 0) return game;
  const spot = nextInt(game.seed, empty.length);
  const kind = nextFloat(spot.seed);
  const key = empty[spot.value] ?? 0;
  const tile: Tile = { id: game.nextId, col: key % SIZE, row: Math.floor(key / SIZE), level: kind.value < 0.9 ? 1 : 2, born: true, merged: false };
  return { tiles: [...game.tiles, tile], seed: kind.seed, nextId: game.nextId + 1 };
};

export const createGame = (seed: Seed): DobraGame => {
  const first = spawn({ tiles: [], seed: toSeed(seed), nextId: 1 });
  const second = spawn(first);
  return { ...second, score: 0, moves: 0, status: 'playing', keepGoing: false };
};

export const initialState = (seed: Seed, best = 0): DobraState => ({ best, game: createGame(seed) });

/** Cells of one row or column, starting at the edge the tiles slide towards. */
const lineFor = (direction: Direction, index: number): readonly { col: number; row: number }[] =>
  Array.from({ length: SIZE }, (_, step) => {
    switch (direction) {
      case 'left':
        return { col: step, row: index };
      case 'right':
        return { col: SIZE - 1 - step, row: index };
      case 'up':
        return { col: index, row: step };
      case 'down':
        return { col: index, row: SIZE - 1 - step };
    }
  });

export const canMove = (tiles: readonly Tile[]): boolean => {
  if (tiles.length < SIZE * SIZE) return true;
  const at = (col: number, row: number) => tiles.find((tile) => tile.col === col && tile.row === row)?.level;
  return tiles.some((tile) => tile.level === at(tile.col + 1, tile.row) || tile.level === at(tile.col, tile.row + 1));
};

interface Slid {
  readonly tiles: Tile[];
  readonly gained: number;
  readonly changed: boolean;
}

const slide = (tiles: readonly Tile[], direction: Direction): Slid => {
  const out: Tile[] = [];
  let gained = 0;
  let changed = false;
  for (let index = 0; index < SIZE; index += 1) {
    const line = lineFor(direction, index);
    const present = line.flatMap((cell) => tiles.filter((tile) => tile.col === cell.col && tile.row === cell.row));
    const placed: { tile: Tile; fresh: boolean }[] = [];
    for (const tile of present) {
      const last = placed.at(-1);
      if (last && !last.fresh && last.tile.level === tile.level) {
        last.tile = { ...last.tile, level: tile.level + 1, merged: true };
        last.fresh = true;
        gained += valueOf(tile.level + 1);
        changed = true;
      } else {
        placed.push({ tile: { ...tile, born: false, merged: false }, fresh: false });
      }
    }
    placed.forEach(({ tile }, step) => {
      const cell = line[step];
      if (!cell) return;
      if (tile.col !== cell.col || tile.row !== cell.row) changed = true;
      out.push({ ...tile, col: cell.col, row: cell.row });
    });
  }
  return { tiles: out, gained, changed };
};

export const dobraReducer = (state: DobraState, action: DobraAction): DobraState => {
  const { game } = state;
  switch (action.type) {
    case 'newGame':
      return { best: state.best, game: createGame(action.seed) };
    case 'continue':
      return game.status === 'won' ? { ...state, game: { ...game, status: 'playing', keepGoing: true } } : state;
    case 'move': {
      if (game.status !== 'playing') return state;
      const slid = slide(game.tiles, action.direction);
      if (!slid.changed) return state;
      const grown = spawn({ tiles: slid.tiles, seed: game.seed, nextId: game.nextId });
      const score = game.score + slid.gained;
      const reachedWin = !game.keepGoing && grown.tiles.some((tile) => tile.level >= WIN_LEVEL);
      const status: Status = reachedWin ? 'won' : canMove(grown.tiles) ? 'playing' : 'lost';
      return { best: Math.max(state.best, score), game: { ...game, ...grown, score, moves: game.moves + 1, status } };
    }
  }
};
