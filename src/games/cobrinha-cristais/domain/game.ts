import { nextInt } from '@shared/domain/rng';

export const SIZE = 16;
export type Direction = 'up' | 'down' | 'left' | 'right';
export interface Cell { readonly x: number; readonly y: number }
export interface SnakeState {
  readonly body: readonly Cell[]; readonly direction: Direction; readonly pending: Direction;
  readonly food: Cell | null; readonly score: number; readonly seed: number;
  readonly status: 'playing' | 'lost' | 'won';
}
const DELTA: Record<Direction, Cell> = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const OPPOSITE: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' };
export const sameCell = (a: Cell, b: Cell): boolean => a.x === b.x && a.y === b.y;

export const spawnFood = (body: readonly Cell[], seed: number): { food: Cell | null; seed: number } => {
  const free = Array.from({ length: SIZE * SIZE }, (_, index) => ({ x: index % SIZE, y: Math.floor(index / SIZE) }))
    .filter((cell) => !body.some((part) => sameCell(cell, part)));
  if (free.length === 0) return { food: null, seed };
  const roll = nextInt(seed, free.length);
  return { food: free[roll.value] ?? null, seed: roll.seed };
};

export const createSnake = (seed: number): SnakeState => {
  const body = [{ x: 7, y: 8 }, { x: 6, y: 8 }, { x: 5, y: 8 }];
  return { body, direction: 'right', pending: 'right', score: 0, status: 'playing', ...spawnFood(body, seed) };
};

export const turnSnake = (state: SnakeState, direction: Direction): SnakeState =>
  state.status !== 'playing' || direction === OPPOSITE[state.direction] ? state : { ...state, pending: direction };

export const stepSnake = (state: SnakeState): SnakeState => {
  if (state.status !== 'playing') return state;
  const head = state.body[0];
  if (!head) return { ...state, status: 'lost' };
  const delta = DELTA[state.pending];
  const next = { x: head.x + delta.x, y: head.y + delta.y };
  const grows = state.food !== null && sameCell(next, state.food);
  const obstacle = grows ? state.body : state.body.slice(0, -1);
  if (next.x < 0 || next.y < 0 || next.x >= SIZE || next.y >= SIZE || obstacle.some((cell) => sameCell(next, cell))) {
    return { ...state, status: 'lost' };
  }
  const body = [next, ...(grows ? state.body : state.body.slice(0, -1))];
  const spawned = grows ? spawnFood(body, state.seed) : { food: state.food, seed: state.seed };
  return { ...state, ...spawned, body, direction: state.pending, score: state.score + (grows ? 10 : 0), status: spawned.food === null ? 'won' : 'playing' };
};
