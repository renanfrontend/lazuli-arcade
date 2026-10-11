import type { Board } from './board';
import type { GemKind } from './gem';
import { colIndices, rowIndices, toPosition, updateCells, type Position } from '@shared/domain/grid';

export interface LineSet {
  readonly rows: readonly number[];
  readonly cols: readonly number[];
}

export interface ClearedCell {
  readonly position: Position;
  readonly gem: GemKind;
}

export interface ClearResult {
  readonly board: Board;
  readonly cleared: readonly ClearedCell[];
}

export const EMPTY_LINES: LineSet = { rows: [], cols: [] };

export const lineTotal = (lines: LineSet): number => lines.rows.length + lines.cols.length;

const isFull = (board: Board, indices: readonly number[]): boolean =>
  indices.every((index) => board.cells[index] != null);

export const findCompletedLines = (board: Board): LineSet => ({
  rows: Array.from({ length: board.rows }, (_, row) => row).filter((row) => isFull(board, rowIndices(board, row))),
  cols: Array.from({ length: board.cols }, (_, col) => col).filter((col) => isFull(board, colIndices(board, col))),
});

/** Removes every cell on the given rows and columns; crossings are cleared once. */
export const clearLines = (board: Board, lines: LineSet): ClearResult => {
  const indices = new Set<number>([
    ...lines.rows.flatMap((row) => rowIndices(board, row)),
    ...lines.cols.flatMap((col) => colIndices(board, col)),
  ]);

  const cleared = [...indices]
    .sort((a, b) => a - b)
    .map((index): ClearedCell => {
      const gem = board.cells[index];
      if (gem == null) throw new RangeError(`Cell #${index} is empty and cannot be cleared`);
      return { position: toPosition(board, index), gem };
    });

  return {
    board: updateCells(
      board,
      cleared.map(({ position }) => [position, null] as const),
    ),
    cleared,
  };
};
