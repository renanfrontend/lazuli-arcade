import { describe, expect, it } from 'vitest';
import { clearLines, findCompletedLines, lineTotal } from '../lines';
import { boardFrom, boardToArt } from './fixtures';

describe('lines', () => {
  it('finds completed rows and columns', () => {
    const board = boardFrom(`
      #.#
      ###
      #..
    `);
    expect(findCompletedLines(board)).toEqual({ rows: [1], cols: [0] });
  });

  it('clears crossings only once and keeps the input untouched', () => {
    const board = boardFrom(`
      #r#
      ###
      #..
    `);
    const lines = findCompletedLines(board);
    expect(lines).toEqual({ rows: [0, 1], cols: [0] });
    expect(lineTotal(lines)).toBe(3);
    const { board: next, cleared } = clearLines(board, lines);
    expect(boardToArt(next)).toBe(['...', '...', '...'].join('\n'));
    expect(cleared).toHaveLength(7);
    expect(cleared.find(({ position }) => position.col === 1 && position.row === 0)?.gem).toBe('ruby');
    expect(boardToArt(board)).toBe(['###', '###', '#..'].join('\n'));
  });

  it('refuses to clear an empty cell', () => {
    const board = boardFrom(`
      #.
      ##
    `);
    expect(() => clearLines(board, { rows: [0], cols: [] })).toThrow(RangeError);
  });
});
