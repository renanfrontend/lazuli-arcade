import { samePosition, toPosition, type Position } from '@shared/domain/grid';
import { isFreeCell, type Board } from '../domain';
import { cellDistance, floorCenter, LAYER, SQUASH, topFaceCenter, type BoardMetrics, type Point } from './geometry';

/** Unit metrics: enough for directions and nearest-cell questions that do not need pixels. */
const unitMetrics = (board: Board): BoardMetrics => ({
  hw: 1,
  hh: SQUASH,
  t: LAYER,
  left: 0,
  top: 0,
  cols: board.cols,
  rows: board.rows,
});

const openCells = (board: Board): Position[] =>
  board.cells.flatMap((cell, index) => (cell.kind === 'open' ? [toPosition(board, index)] : []));

const DIRECTIONS: Readonly<Record<string, Point>> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

export const isArrowKey = (key: string): boolean => key in DIRECTIONS;

/**
 * Moves the cursor in screen space: the board is drawn rotated, so "right" means the nearest
 * open cell to the right on screen, not the next column.
 */
export const nextCellInDirection = (board: Board, from: Position, key: string): Position => {
  const direction = DIRECTIONS[key];
  if (!direction) return from;
  const metrics = unitMetrics(board);
  const origin = floorCenter(metrics, from);
  let best: Position | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const candidate of openCells(board)) {
    if (samePosition(candidate, from)) continue;
    const point = floorCenter(metrics, candidate);
    const dx = point.x - origin.x;
    const dy = point.y - origin.y;
    const distance = Math.hypot(dx, dy);
    const along = (dx * direction.x + dy * direction.y) / distance;
    if (along < 0.5) continue; // more than 60° off the pressed direction
    const score = distance * (2 - along);
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best ?? from;
};

/** Free cell closest to the middle of the board: where a freshly selected stack starts. */
export const centralFreeCell = (board: Board): Position | null => {
  const metrics = unitMetrics(board);
  const middle = floorCenter(metrics, { col: (board.cols - 1) / 2, row: (board.rows - 1) / 2 });
  let best: Position | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const candidate of openCells(board)) {
    if (!isFreeCell(board, candidate)) continue;
    const distance = cellDistance(metrics, floorCenter(metrics, candidate), middle);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
};

/** Open cell under a viewport point (a tap), within half a cell. */
export const cellAtPoint = (metrics: BoardMetrics, board: Board, point: Point): Position | null => {
  let best: Position | null = null;
  let bestDistance = 0.55;
  for (const candidate of openCells(board)) {
    const distance = cellDistance(metrics, floorCenter(metrics, candidate), point);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
};

/** Free cell nearest to where a dragged stack's bottom tile would touch down. */
export const dropTarget = (metrics: BoardMetrics, board: Board, base: Point): Position | null => {
  let best: Position | null = null;
  let bestDistance = 0.62;
  for (const candidate of openCells(board)) {
    if (!isFreeCell(board, candidate)) continue;
    const distance = cellDistance(metrics, topFaceCenter(metrics, candidate, 1), base);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
};
