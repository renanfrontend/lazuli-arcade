import { gridFromCells, toIndex, type Position } from '@shared/domain/grid';
import { stackAt, type Board, type Cell } from '../board';
import type { TraySlot } from '../dealer';
import type { Side } from '../side';
import { stackFromCodes, type Stack } from '../stack';
import { TILE_CODES } from '../tiles';

export const stackOf = (codes: string): Stack => {
  const stack = stackFromCodes(codes);
  if (!stack) throw new Error(`Unknown tile code in "${codes}"`);
  return stack;
};

export const codesOf = (stack: Stack | null): string => (stack ?? []).map((color) => TILE_CODES[color]).join('');

/**
 * Board from rows of space-separated cells, read top row first:
 * `.` outside, `_` free, `L90` locked until 90 points, otherwise tile codes bottom → top (`ggs` = sky on two grapes).
 */
export const boardOf = (rows: readonly string[]): Board => {
  const parsed = rows.map((row) => row.trim().split(/\s+/));
  const cols = parsed[0]?.length ?? 0;
  const cells = parsed.flatMap((tokens) => {
    if (tokens.length !== cols) throw new Error('Ragged fixture');
    return tokens.map((token): Cell => {
      if (token === '.') return { kind: 'void' };
      if (token === '_') return { kind: 'open', stack: [] };
      if (token.startsWith('L')) return { kind: 'locked', unlockAt: Number(token.slice(1)) };
      return { kind: 'open', stack: stackOf(token) };
    });
  });
  return gridFromCells(cols, parsed.length, cells);
};

export const codesAt = (board: Board, col: number, row: number): string => codesOf(stackAt(board, { col, row }));

export const tray = (...codes: (string | null)[]): TraySlot[] =>
  codes.map((code, index) => (code === null ? null : { id: 100 + index, tiles: stackOf(code) }));

export const sideOf = (board: Board, slots: TraySlot[], score = 0): Side => ({
  board,
  tray: slots,
  score,
  moves: 0,
  seed: 12345,
  nextId: 200,
});

export const tileCount = (board: Board): number =>
  board.cells.reduce((total, cell) => total + (cell.kind === 'open' ? cell.stack.length : 0), 0);

export const at = (col: number, row: number): Position => ({ col, row });

export const indexOf = (board: Board, position: Position): number => toIndex(board, position);
