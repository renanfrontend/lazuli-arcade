import type { GemKind } from './gem';
import { countCells, createGrid, type Grid } from './grid';

export type BoardCell = GemKind | null;
export type Board = Grid<BoardCell>;

export const createBoard = (cols: number, rows: number): Board => createGrid<BoardCell>(cols, rows, null);

export const isGem = (cell: BoardCell): cell is GemKind => cell !== null;

export const filledCount = (board: Board): number => countCells(board, isGem);

export const fillRatio = (board: Board): number => filledCount(board) / board.cells.length;

export const isBoardEmpty = (board: Board): boolean => board.cells.every((cell) => cell === null);
