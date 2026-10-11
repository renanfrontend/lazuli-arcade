import { describe, expect, it } from 'vitest';
import { createBoard } from '../board';
import { anyPieceFits, dealTray } from '../dealer';
import { fitsAnywhere } from '../placement';
import { SHAPE_CATALOG } from '../shapes';
import { boardFrom } from './fixtures';

describe('dealTray', () => {
  it('deals the requested number of pieces with sequential ids', () => {
    const deal = dealTray(5, {
      board: createBoard(11, 13),
      catalog: SHAPE_CATALOG,
      palette: ['sapphire'],
      size: 3,
      nextPieceId: 40,
    });
    expect(deal.tray.map(({ id }) => id)).toEqual([40, 41, 42]);
    expect(deal.nextPieceId).toBe(43);
    expect(deal.tray.every(({ gem }) => gem === 'sapphire')).toBe(true);
  });

  it('always deals at least one fitting piece when anything fits', () => {
    // Only single cells fit on this checkerboard.
    const board = boardFrom(`
      #.#.#.
      .#.#.#
      #.#.#.
      .#.#.#
    `);
    for (let seed = 0; seed < 200; seed += 1) {
      const deal = dealTray(seed, { board, catalog: SHAPE_CATALOG, palette: ['sapphire'], size: 3, nextPieceId: 1 });
      expect(anyPieceFits(board, deal.tray)).toBe(true);
      expect(deal.tray.some(({ shape }) => fitsAnywhere(board, shape))).toBe(true);
    }
  });

  it('is deterministic for the same seed', () => {
    const context = { board: createBoard(8, 8), catalog: SHAPE_CATALOG, palette: ['sapphire', 'ruby'] as const, size: 3, nextPieceId: 1 };
    expect(dealTray(9, context)).toEqual(dealTray(9, context));
  });
});
