import { describe, expect, it } from 'vitest';
import { cellAt, colIndices, createGrid, isInside, rowIndices, toIndex, toPosition, updateCells } from '../grid';

describe('grid', () => {
  it('rejects invalid sizes', () => {
    expect(() => createGrid(0, 3, null)).toThrow(RangeError);
    expect(() => createGrid(2.5, 3, null)).toThrow(RangeError);
  });

  it('maps positions to indices and back', () => {
    const grid = createGrid(4, 3, 0);
    for (let index = 0; index < grid.cells.length; index += 1) {
      expect(toIndex(grid, toPosition(grid, index))).toBe(index);
    }
    expect(toPosition(grid, 5)).toEqual({ col: 1, row: 1 });
  });

  it('returns undefined outside the grid', () => {
    const grid = createGrid(2, 2, 'x');
    expect(cellAt(grid, { col: 2, row: 0 })).toBeUndefined();
    expect(cellAt(grid, { col: -1, row: 1 })).toBeUndefined();
    expect(isInside(grid, { col: 1, row: 1 })).toBe(true);
  });

  it('updates immutably', () => {
    const grid = createGrid(3, 2, 0);
    const next = updateCells(grid, [[{ col: 2, row: 1 }, 9]]);
    expect(cellAt(next, { col: 2, row: 1 })).toBe(9);
    expect(cellAt(grid, { col: 2, row: 1 })).toBe(0);
    expect(() => updateCells(grid, [[{ col: 3, row: 0 }, 1]])).toThrow(RangeError);
  });

  it('lists row and column indices', () => {
    const grid = createGrid(3, 2, 0);
    expect(rowIndices(grid, 1)).toEqual([3, 4, 5]);
    expect(colIndices(grid, 2)).toEqual([2, 5]);
  });
});
