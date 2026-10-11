import { describe, expect, it } from 'vitest';
import {
  adaptiveWeight,
  DEFAULT_SHAPE_SPECS,
  difficultyLevel,
  orientations,
  parsePattern,
  SHAPE_CATALOG,
} from '../shapes';
import { shape } from './fixtures';

describe('shape patterns', () => {
  it('parses and normalizes offsets', () => {
    expect(parsePattern('.#\n##')).toEqual([
      { col: 1, row: 0 },
      { col: 0, row: 1 },
      { col: 1, row: 1 },
    ]);
  });

  it('rejects empty or malformed patterns', () => {
    expect(() => parsePattern('..')).toThrow(SyntaxError);
    expect(() => parsePattern('#x')).toThrow(SyntaxError);
  });

  it.each([
    ['#', false, 1],
    ['###', false, 2],
    ['##\n##', false, 1],
    ['#.\n##', false, 4],
    ['###\n.#.', false, 4],
    ['#.\n#.\n##', true, 8],
    ['.##\n##.', true, 4],
  ])('pattern %j (mirrored: %s) has %i orientations', (pattern, mirrored, count) => {
    expect(orientations(parsePattern(pattern), mirrored)).toHaveLength(count);
  });
});

describe('catalog', () => {
  it('has unique ids and consistent bounds', () => {
    const ids = SHAPE_CATALOG.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const { cells, width, height } of SHAPE_CATALOG) {
      expect(Math.max(...cells.map(({ col }) => col)) + 1).toBe(width);
      expect(Math.max(...cells.map(({ row }) => row)) + 1).toBe(height);
      expect(Math.min(...cells.map(({ col }) => col))).toBe(0);
      expect(Math.min(...cells.map(({ row }) => row))).toBe(0);
    }
  });

  it('splits each spec weight across its orientations', () => {
    for (const spec of DEFAULT_SHAPE_SPECS) {
      const total = SHAPE_CATALOG.filter(({ id }) => id === spec.key || id.startsWith(`${spec.key}-`)).reduce(
        (sum, { weight }) => sum + weight,
        0,
      );
      expect(total).toBeCloseTo(spec.weight);
    }
  });
});

describe('adaptiveWeight', () => {
  const small = shape('dot');
  const large = shape('square3');
  const medium = shape('square2');

  it('keeps base weights on a balanced board', () => {
    expect(adaptiveWeight(small, 0.35)).toBe(small.weight);
    expect(adaptiveWeight(large, 0.35)).toBe(large.weight);
  });

  it('favours small pieces when the board is crowded', () => {
    expect(adaptiveWeight(small, 0.8)).toBeCloseTo(small.weight * 2.5);
    expect(adaptiveWeight(large, 0.8)).toBeCloseTo(large.weight * 0.25);
    expect(adaptiveWeight(medium, 0.8)).toBe(medium.weight);
  });

  it('favours big pieces on an open board', () => {
    expect(adaptiveWeight(large, 0.1)).toBeCloseTo(large.weight * 1.3);
  });

  it('ramps difficulty with the level', () => {
    expect(adaptiveWeight(large, 0.35, 1)).toBeGreaterThan(adaptiveWeight(large, 0.35, 0));
    expect(adaptiveWeight(small, 0.35, 1)).toBeLessThan(adaptiveWeight(small, 0.35, 0));
    // Relief on a crowded board fades at high levels.
    expect(adaptiveWeight(small, 0.8, 1) / adaptiveWeight(small, 0.35, 1)).toBeLessThan(2.5);
  });
});

describe('difficultyLevel', () => {
  it('climbs linearly and caps at 1', () => {
    expect(difficultyLevel(0, 300)).toBe(0);
    expect(difficultyLevel(150, 300)).toBe(0.5);
    expect(difficultyLevel(900, 300)).toBe(1);
    expect(difficultyLevel(10, 0)).toBe(1);
  });
});
