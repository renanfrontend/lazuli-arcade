import type { Board } from './board';
import type { GemKind } from './gem';
import { cellAt, translate, updateCells, type Position } from './grid';
import { EMPTY_LINES, findCompletedLines, type LineSet } from './lines';
import type { Shape } from './shapes';

export const footprint = (shape: Shape, origin: Position): Position[] =>
  shape.cells.map((offset) => translate(origin, offset));

export const canPlace = (board: Board, shape: Shape, origin: Position): boolean =>
  shape.cells.every((offset) => cellAt(board, translate(origin, offset)) === null);

export const placeShape = (board: Board, shape: Shape, origin: Position, gem: GemKind): Board => {
  if (!canPlace(board, shape, origin)) {
    throw new RangeError(`Shape ${shape.id} does not fit at ${origin.col},${origin.row}`);
  }
  return updateCells(
    board,
    footprint(shape, origin).map((position) => [position, gem] as const),
  );
};

export function* validOrigins(board: Board, shape: Shape): Generator<Position, void, undefined> {
  for (let row = 0; row + shape.height <= board.rows; row += 1) {
    for (let col = 0; col + shape.width <= board.cols; col += 1) {
      const origin = { col, row };
      if (canPlace(board, shape, origin)) yield origin;
    }
  }
}

export const fitsAnywhere = (board: Board, shape: Shape): boolean => validOrigins(board, shape).next().done !== true;

/**
 * Snaps a fractional board coordinate (the dragged piece's top-left corner,
 * measured in cells) to the closest origin where the shape fits. Searching the
 * 3x3 neighbourhood makes drops forgiving on touch screens.
 */
export const nearestValidOrigin = (
  board: Board,
  shape: Shape,
  exact: Position,
  maxDistance = 0.85,
): Position | null => {
  const base = { col: Math.round(exact.col), row: Math.round(exact.row) };
  let best: Position | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let dRow = -1; dRow <= 1; dRow += 1) {
    for (let dCol = -1; dCol <= 1; dCol += 1) {
      const candidate = { col: base.col + dCol, row: base.row + dRow };
      const distance = Math.hypot(candidate.col - exact.col, candidate.row - exact.row);
      if (distance <= maxDistance && distance < bestDistance && canPlace(board, shape, candidate)) {
        best = candidate;
        bestDistance = distance;
      }
    }
  }
  return best;
};

/** Clamps an origin so the whole shape stays inside the board. */
export const clampOrigin = (board: Board, shape: Shape, origin: Position): Position => ({
  col: Math.min(Math.max(origin.col, 0), board.cols - shape.width),
  row: Math.min(Math.max(origin.row, 0), board.rows - shape.height),
});

export interface PlacementPreview {
  readonly valid: boolean;
  readonly cells: readonly Position[];
  /** Lines this placement would complete (empty when invalid). */
  readonly lines: LineSet;
}

export const previewPlacement = (board: Board, shape: Shape, origin: Position, gem: GemKind): PlacementPreview => {
  const cells = footprint(shape, origin);
  if (!canPlace(board, shape, origin)) return { valid: false, cells, lines: EMPTY_LINES };
  return { valid: true, cells, lines: findCompletedLines(placeShape(board, shape, origin, gem)) };
};
