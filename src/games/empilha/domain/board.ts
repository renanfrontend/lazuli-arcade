import { cellAt, gridFromCells, isInside, toPosition, updateCells, type Grid, type Position } from '@shared/domain/grid';
import { EMPTY_STACK, topColor, type Stack } from './stack';
import type { TileColor } from './tiles';

export type Cell =
  /** Outside the board's shape. */
  | { readonly kind: 'void' }
  /** Opens once the owner's score reaches `unlockAt`. */
  | { readonly kind: 'locked'; readonly unlockAt: number }
  /** A playable spot; an empty stack means a free cell. */
  | { readonly kind: 'open'; readonly stack: Stack };

export type Board = Grid<Cell>;

export const VOID_CELL: Cell = { kind: 'void' };
export const EMPTY_CELL: Cell = { kind: 'open', stack: EMPTY_STACK };

/** Board shape as text: `#` open, `.` outside, `L` locked (thresholds consumed in reading order). */
export interface Layout {
  readonly rows: readonly string[];
  readonly unlockAt: readonly number[];
}

export const boardFromLayout = (layout: Layout): Board => {
  const cols = layout.rows[0]?.length ?? 0;
  let lockIndex = 0;
  const cells = layout.rows.flatMap((row) => {
    if (row.length !== cols) throw new RangeError(`Ragged layout row "${row}"`);
    return Array.from(row, (char): Cell => {
      if (char === '#') return EMPTY_CELL;
      if (char === '.') return VOID_CELL;
      if (char === 'L') {
        const unlockAt = layout.unlockAt[lockIndex];
        lockIndex += 1;
        if (unlockAt === undefined) throw new RangeError('Every locked cell needs a threshold');
        return { kind: 'locked', unlockAt };
      }
      throw new SyntaxError(`Unexpected "${char}" in layout`);
    });
  });
  return gridFromCells(cols, layout.rows.length, cells);
};

export const stackAt = (board: Board, position: Position): Stack | null => {
  const cell = cellAt(board, position);
  return cell?.kind === 'open' ? cell.stack : null;
};

export const topColorAt = (board: Board, position: Position): TileColor | null => {
  const stack = stackAt(board, position);
  return stack ? topColor(stack) : null;
};

export const isFreeCell = (board: Board, position: Position): boolean => stackAt(board, position)?.length === 0;

const OFFSETS: readonly Position[] = [
  { col: 0, row: -1 },
  { col: 1, row: 0 },
  { col: 0, row: 1 },
  { col: -1, row: 0 },
];

/** Open cells sharing an edge (the board is drawn rotated 45°, so these read as diagonals on screen). */
export const openNeighbors = (board: Board, { col, row }: Position): Position[] =>
  OFFSETS.map((offset) => ({ col: col + offset.col, row: row + offset.row })).filter(
    (position) => isInside(board, position) && cellAt(board, position)?.kind === 'open',
  );

export const positionsWhere = (board: Board, predicate: (cell: Cell) => boolean): Position[] =>
  board.cells.flatMap((cell, index) => (predicate(cell) ? [toPosition(board, index)] : []));

export const freeCells = (board: Board): Position[] =>
  positionsWhere(board, (cell) => cell.kind === 'open' && cell.stack.length === 0);

export const withStack = (board: Board, position: Position, stack: Stack): Board =>
  updateCells(board, [[position, { kind: 'open', stack }]]);

/** Opens every locked cell whose threshold the score has reached. */
export const unlockReached = (board: Board, score: number): { readonly board: Board; readonly unlocked: Position[] } => {
  const unlocked = positionsWhere(board, (cell) => cell.kind === 'locked' && cell.unlockAt <= score);
  if (unlocked.length === 0) return { board, unlocked };
  return { board: updateCells(board, unlocked.map((position) => [position, EMPTY_CELL] as const)), unlocked };
};
