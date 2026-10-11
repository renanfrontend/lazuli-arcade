import { nextInt } from '@shared/domain/rng';
export type Direction = 'left' | 'right' | 'up' | 'down';
export interface GridState { readonly board: readonly number[]; readonly score: number; readonly seed: number }
export function mergeLine(line: readonly number[]): { line: number[]; score: number } {
  const values = line.filter((v) => v !== 0), result: number[] = [];
  let score = 0;
  for (let i = 0; i < values.length; i++) {
    const value = values[i] ?? 0;
    if (value === values[i + 1]) { result.push(value * 2); score += value * 2; i++; }
    else result.push(value);
  }
  while (result.length < 4) result.push(0);
  return { line: result, score };
}
function spawn(state: GridState): GridState {
  const empty = state.board.flatMap((v, i) => v === 0 ? [i] : []);
  if (!empty.length) return state;
  const position = nextInt(state.seed, empty.length), tile = nextInt(position.seed, 10);
  const board = [...state.board]; board[empty[position.value] ?? 0] = tile.value === 0 ? 4 : 2;
  return { ...state, board, seed: tile.seed };
}
export const createGrid = (seed: number): GridState => spawn(spawn({ board: Array<number>(16).fill(0), score: 0, seed }));
export function slideGrid(state: GridState, direction: Direction): GridState {
  const board = [...state.board]; let score = state.score;
  for (let row = 0; row < 4; row++) {
    const indices = Array.from({ length: 4 }, (_, col) => {
      if (direction === 'left') return row * 4 + col;
      if (direction === 'right') return row * 4 + 3 - col;
      if (direction === 'up') return col * 4 + row;
      return (3 - col) * 4 + row;
    });
    const merged = mergeLine(indices.map((i) => state.board[i] ?? 0));
    indices.forEach((i, col) => { board[i] = merged.line[col] ?? 0; }); score += merged.score;
  }
  return board.every((v, i) => v === state.board[i]) ? state : { ...state, board, score };
}
export const moveGrid = (state: GridState, direction: Direction): GridState => {
  const next = slideGrid(state, direction); return next === state ? state : spawn(next);
};
export const isGridOver = (state: GridState): boolean => (['left', 'right', 'up', 'down'] as const).every((direction) => slideGrid(state, direction) === state);
export function restoreGrid(raw: unknown): GridState | null {
  if (typeof raw !== 'object' || raw === null || !('board' in raw) || !('score' in raw) || !('seed' in raw)) return null;
  if (!Array.isArray(raw.board) || raw.board.length !== 16 || !raw.board.every((v: unknown) => typeof v === 'number' && Number.isInteger(v) && (v === 0 || (v >= 2 && v <= 2 ** 30 && Number.isInteger(Math.log2(v)))))) return null;
  if (typeof raw.score !== 'number' || !Number.isSafeInteger(raw.score) || raw.score < 0 || typeof raw.seed !== 'number' || !Number.isInteger(raw.seed)) return null;
  if (raw.board.filter((v: unknown) => v !== 0).length < 2) return null;
  return { board: raw.board as number[], score: raw.score, seed: raw.seed >>> 0 };
}
