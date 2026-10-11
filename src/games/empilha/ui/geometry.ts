import type { Position } from '@shared/domain/grid';

/*
 * The board is a square grid turned 45°. Every size derives from `hw`, half a diamond's width:
 *   diamond centre of (col,row): x = (col − row + rows) · hw,  y = headroom + (col + row + 1) · hh
 * A stack's top face sits `tiles · t` above its floor tile.
 */

/** Diamond height / width: a slight squash reads as a tabletop seen from above. */
export const SQUASH = 0.86;
/** Thickness of one tile, in half-widths. */
export const LAYER = 0.11;
/** Tallest stack drawn; anything below is implied. */
export const MAX_LAYERS = 12;
/** Room above the back row for tall stacks, in half-widths. */
export const HEADROOM = MAX_LAYERS * LAYER + 0.2;

export interface BoardMetrics {
  readonly hw: number;
  readonly hh: number;
  readonly t: number;
  readonly left: number;
  readonly top: number;
  readonly cols: number;
  readonly rows: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Measures a rendered board element (its width is `(cols + rows) · hw`). */
export const measureBoard = (element: Element, cols: number, rows: number): BoardMetrics => {
  const rect = element.getBoundingClientRect();
  const hw = rect.width / (cols + rows);
  return { hw, hh: hw * SQUASH, t: hw * LAYER, left: rect.left, top: rect.top, cols, rows };
};

/** Viewport centre of a cell's floor tile. */
export const floorCenter = (metrics: BoardMetrics, { col, row }: Position): Point => ({
  x: metrics.left + (col - row + metrics.rows) * metrics.hw,
  y: metrics.top + HEADROOM * metrics.hw + (col + row + 1) * metrics.hh,
});

/** Viewport centre of the top face of a stack of `tiles` tiles standing on the cell. */
export const topFaceCenter = (metrics: BoardMetrics, position: Position, tiles: number): Point => {
  const floor = floorCenter(metrics, position);
  return { x: floor.x, y: floor.y - Math.min(tiles, MAX_LAYERS) * metrics.t };
};

/** Size of a stack element drawn at board scale. */
export const stackSize = (metrics: Pick<BoardMetrics, 'hw' | 'hh' | 't'>, tiles: number) => ({
  width: 2 * metrics.hw,
  height: 2 * metrics.hh + Math.max(0, Math.min(tiles, MAX_LAYERS) - 1) * metrics.t,
});

/** Distance in "cells": 1 means one diamond-width away horizontally or one diamond-height vertically. */
export const cellDistance = (metrics: BoardMetrics, a: Point, b: Point): number =>
  Math.hypot((a.x - b.x) / metrics.hw, (a.y - b.y) / metrics.hh) / 2;
