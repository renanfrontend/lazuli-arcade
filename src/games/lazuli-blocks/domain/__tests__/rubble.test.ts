import { describe, expect, it } from 'vitest';
import { createBoard } from '../board';
import { findCompletedLines, lineTotal } from '../lines';
import { generateRubble, type RubbleOptions } from '../rubble';

const options: RubbleOptions = { rows: 6, bottomDensity: 1, topDensity: 0.4, wellBias: 0.45, minGapsPerRow: 2 };

describe('generateRubble', () => {
  it('fills only the bottom rows and never completes a line', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const { value: board } = generateRubble(createBoard(11, 13), seed, options, ['sapphire']);
      expect(lineTotal(findCompletedLines(board))).toBe(0);
      expect(board.cells.slice(0, 11 * 7).every((cell) => cell === null)).toBe(true);
      for (let row = 7; row < 13; row += 1) {
        const empty = board.cells.slice(row * 11, (row + 1) * 11).filter((cell) => cell === null).length;
        expect(empty).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('is deterministic', () => {
    const a = generateRubble(createBoard(11, 13), 77, options, ['sapphire', 'ruby']);
    const b = generateRubble(createBoard(11, 13), 77, options, ['sapphire', 'ruby']);
    expect(a).toEqual(b);
  });
});
