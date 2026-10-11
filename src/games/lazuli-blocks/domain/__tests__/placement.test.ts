import { describe, expect, it } from 'vitest';
import { createBoard } from '../board';
import {
  canPlace,
  clampOrigin,
  fitsAnywhere,
  nearestValidOrigin,
  placeShape,
  previewPlacement,
  validOrigins,
} from '../placement';
import { boardFrom, boardToArt, shape, shapeLike } from './fixtures';

describe('placement', () => {
  const line3 = shapeLike('###');
  const square2 = shape('square2');

  it('rejects positions outside the board or over gems', () => {
    const board = boardFrom(`
      ....
      .#..
      ....
    `);
    expect(canPlace(board, line3, { col: 1, row: 0 })).toBe(true);
    expect(canPlace(board, line3, { col: 2, row: 0 })).toBe(false);
    expect(canPlace(board, line3, { col: 0, row: 1 })).toBe(false);
    expect(canPlace(board, line3, { col: -1, row: 2 })).toBe(false);
  });

  it('places a shape immutably', () => {
    const board = createBoard(4, 3);
    const next = placeShape(board, square2, { col: 2, row: 1 }, 'ruby');
    expect(boardToArt(next)).toBe(['....', '..##', '..##'].join('\n'));
    expect(boardToArt(board)).toBe(['....', '....', '....'].join('\n'));
    expect(() => placeShape(next, square2, { col: 1, row: 0 }, 'ruby')).toThrow(RangeError);
  });

  it('enumerates every valid origin', () => {
    const board = createBoard(5, 4);
    expect([...validOrigins(board, line3)]).toHaveLength(3 * 4);
    expect(fitsAnywhere(board, shape('square3'))).toBe(true);
  });

  it('detects a jammed board', () => {
    const board = boardFrom(`
      #.#.
      .#.#
      #.#.
    `);
    expect(fitsAnywhere(board, shape('dot'))).toBe(true);
    expect(fitsAnywhere(board, shape('square2'))).toBe(false);
    expect(fitsAnywhere(board, line3)).toBe(false);
  });

  it('snaps fractional drops to the closest valid origin', () => {
    const board = boardFrom(`
      ......
      ......
      ##....
    `);
    expect(nearestValidOrigin(board, square2, { col: 2.2, row: 0.9 })).toEqual({ col: 2, row: 1 });
    // Rounded spot overlaps a gem, the neighbour to the right is free.
    expect(nearestValidOrigin(board, square2, { col: 1.4, row: 1.2 })).toEqual({ col: 2, row: 1 });
    expect(nearestValidOrigin(board, square2, { col: 9, row: 9 })).toBeNull();
  });

  it('clamps an origin to keep the shape on the board', () => {
    const board = createBoard(5, 5);
    expect(clampOrigin(board, line3, { col: 4, row: -2 })).toEqual({ col: 2, row: 0 });
  });

  it('previews the lines a drop would complete', () => {
    const board = boardFrom(`
      ##.#
      ....
    `);
    const preview = previewPlacement(board, shape('dot'), { col: 2, row: 0 }, 'sapphire');
    expect(preview.valid).toBe(true);
    expect(preview.lines).toEqual({ rows: [0], cols: [] });
    expect(previewPlacement(board, shape('dot'), { col: 0, row: 0 }, 'sapphire').valid).toBe(false);
  });
});
