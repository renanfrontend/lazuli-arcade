import type { Board, BoardCell } from './board';
import type { GemKind } from './gem';
import { updateCells, type CellUpdate } from './grid';
import { nextFloat, nextInt, pickOne, type Rolled, type Seed } from './rng';

/** Starting layout: a ragged stack of gems at the bottom, never with a full row. */
export interface RubbleOptions {
  readonly rows: number;
  /** Fill chance on the bottom row. */
  readonly bottomDensity: number;
  /** Fill chance on the highest rubble row. */
  readonly topDensity: number;
  /** Multiplier applied when the cell below is empty: lower values carve vertical wells. */
  readonly wellBias: number;
  readonly minGapsPerRow: number;
}

export const generateRubble = (
  board: Board,
  seed: Seed,
  options: RubbleOptions,
  palette: readonly GemKind[],
): Rolled<Board> => {
  const levels = Math.max(0, Math.min(options.rows, board.rows - 1));
  const minGaps = Math.max(1, Math.min(options.minGapsPerRow, board.cols));
  const filled = new Set<number>();
  const updates: CellUpdate<BoardCell>[] = [];
  let current = seed;

  for (let level = 0; level < levels; level += 1) {
    const row = board.rows - 1 - level;
    const progress = levels === 1 ? 0 : level / (levels - 1);
    const density = options.bottomDensity + (options.topDensity - options.bottomDensity) * progress;
    const rowCols: number[] = [];

    for (let col = 0; col < board.cols; col += 1) {
      const supported = level === 0 || filled.has((row + 1) * board.cols + col);
      const roll = nextFloat(current);
      current = roll.seed;
      if (roll.value < (supported ? density : density * options.wellBias)) rowCols.push(col);
    }

    while (board.cols - rowCols.length < minGaps) {
      const drop = nextInt(current, rowCols.length);
      current = drop.seed;
      rowCols.splice(drop.value, 1);
    }

    for (const col of rowCols) {
      const gem = pickOne(current, palette);
      current = gem.seed;
      filled.add(row * board.cols + col);
      updates.push([{ col, row }, gem.value]);
    }
  }

  return { value: updateCells(board, updates), seed: current };
};
