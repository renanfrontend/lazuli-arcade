import { tileFromCode, type TileColor } from './tiles';

/** Tiles from bottom to top. */
export type Stack = readonly TileColor[];

/** A run of same-colored tiles, listed from the top of the stack downwards. */
export interface Run {
  readonly color: TileColor;
  readonly count: number;
}

export const EMPTY_STACK: Stack = [];

export const topColor = (stack: Stack): TileColor | null => stack.at(-1) ?? null;

export const topRunLength = (stack: Stack): number => {
  const color = topColor(stack);
  let count = 0;
  for (let index = stack.length - 1; index >= 0 && stack[index] === color; index -= 1) count += 1;
  return count;
};

/** Splits off the uppermost run of one color. */
export const splitTopRun = (stack: Stack): { readonly rest: Stack; readonly run: Stack } => {
  const count = topRunLength(stack);
  return { rest: stack.slice(0, stack.length - count), run: stack.slice(stack.length - count) };
};

export const runsFromTop = (stack: Stack): readonly Run[] => {
  const runs: Run[] = [];
  for (let index = stack.length - 1; index >= 0; index -= 1) {
    const color = stack[index];
    if (color === undefined) continue;
    const last = runs.at(-1);
    if (last?.color === color) runs[runs.length - 1] = { color, count: last.count + 1 };
    else runs.push({ color, count: 1 });
  }
  return runs;
};

/** Inverse of runsFromTop. */
export const stackFromRuns = (runs: readonly Run[]): Stack =>
  runs.toReversed().flatMap(({ color, count }) => Array.from({ length: count }, () => color));

/** Stack from one-letter tile codes, bottom → top (`ggs` = a sky tile on two grapes); null if any code is unknown. */
export const stackFromCodes = (codes: string): Stack | null => {
  const tiles: TileColor[] = [];
  for (const code of codes) {
    const color = tileFromCode(code);
    if (!color) return null;
    tiles.push(color);
  }
  return tiles;
};
