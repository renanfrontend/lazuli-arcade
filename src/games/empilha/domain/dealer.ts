import { nextFloat, nextInt, pickOne, pickWeighted, type Rolled, type Seed } from '@shared/domain/rng';
import { positionsWhere, topColorAt, type Board } from './board';
import type { StackRecipe } from './rules';
import { stackFromRuns, type Run, type Stack } from './stack';
import type { TileColor } from './tiles';

export interface TrayStack {
  readonly id: number;
  readonly tiles: Stack;
}

export type TraySlot = TrayStack | null;

/** Top colors currently on the board (with repeats, so common colors weigh more). */
export const boardTopColors = (board: Board): TileColor[] =>
  positionsWhere(board, (cell) => cell.kind === 'open' && cell.stack.length > 0).flatMap((position) => {
    const color = topColorAt(board, position);
    return color ? [color] : [];
  });

/** A random stack of 2–6 tiles in 1–3 runs; neighbouring runs never share a color. */
export const randomStack = (
  seed: Seed,
  recipe: StackRecipe,
  palette: readonly TileColor[],
  preferredTops: readonly TileColor[] = [],
): Rolled<Stack> => {
  let current = seed;
  const roll = <T,>(result: Rolled<T>): T => {
    current = result.seed;
    return result.value;
  };

  const size = roll(pickWeighted(current, recipe.sizes));
  const runCount = Math.min(size, roll(pickWeighted(current, recipe.runs)), palette.length);
  const lengths = Array.from({ length: runCount }, () => 1);
  for (let extra = size - runCount; extra > 0; extra -= 1) {
    const index = roll(nextInt(current, runCount));
    lengths[index] = (lengths[index] ?? 0) + 1;
  }

  const runs: Run[] = [];
  lengths.forEach((count, index) => {
    const previous = runs.at(-1)?.color;
    const usePreferred = index === 0 && preferredTops.length > 0 && roll(nextFloat(current)) < recipe.matchBoardTop;
    const options = usePreferred ? preferredTops : palette.filter((color) => color !== previous);
    runs.push({ color: roll(pickOne(current, options.length > 0 ? options : palette)), count });
  });

  return { value: stackFromRuns(runs), seed: current };
};

export interface DealOptions {
  readonly board: Board;
  readonly recipe: StackRecipe;
  readonly palette: readonly TileColor[];
  readonly size: number;
  readonly nextId: number;
}

export interface Deal {
  readonly tray: readonly TrayStack[];
  readonly seed: Seed;
  readonly nextId: number;
}

export const dealTray = (seed: Seed, { board, recipe, palette, size, nextId }: DealOptions): Deal => {
  const tops = boardTopColors(board).filter((color) => palette.includes(color));
  let current = seed;
  const tray = Array.from({ length: size }, (_, index): TrayStack => {
    const stack = randomStack(current, recipe, palette, tops);
    current = stack.seed;
    return { id: nextId + index, tiles: stack.value };
  });
  return { tray, seed: current, nextId: nextId + size };
};
