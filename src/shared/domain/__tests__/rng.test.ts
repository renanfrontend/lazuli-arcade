import { describe, expect, it } from 'vitest';
import { nextFloat, nextInt, pickOne, pickWeighted, toSeed, type Seed } from '../rng';

const sequence = (seed: Seed, length: number): number[] => {
  const values: number[] = [];
  let current = seed;
  for (let i = 0; i < length; i += 1) {
    const roll = nextFloat(current);
    values.push(roll.value);
    current = roll.seed;
  }
  return values;
};

describe('rng', () => {
  it('is deterministic for a given seed', () => {
    expect(sequence(42, 5)).toEqual(sequence(42, 5));
    expect(sequence(42, 5)).not.toEqual(sequence(43, 5));
  });

  it('stays within [0, 1)', () => {
    for (const value of sequence(7, 2000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('normalizes seeds to uint32', () => {
    expect(toSeed(-1)).toBe(0xffffffff);
    expect(toSeed(Number.NaN)).toBe(0);
    expect(toSeed(12.9)).toBe(12);
  });

  it('draws integers within bounds', () => {
    let seed: Seed = 99;
    const seen = new Set<number>();
    for (let i = 0; i < 500; i += 1) {
      const roll = nextInt(seed, 6);
      seen.add(roll.value);
      seed = roll.seed;
    }
    expect([...seen].sort()).toEqual([0, 1, 2, 3, 4, 5]);
    expect(() => nextInt(1, 0)).toThrow(RangeError);
  });

  it('picks proportionally to weights and skips zero weights', () => {
    const counts = new Map<string, number>();
    let seed: Seed = 2026;
    for (let i = 0; i < 6000; i += 1) {
      const roll = pickWeighted(seed, [
        ['alpha', 1],
        ['beta', 3],
        ['never', 0],
      ]);
      counts.set(roll.value, (counts.get(roll.value) ?? 0) + 1);
      seed = roll.seed;
    }
    expect(counts.has('never')).toBe(false);
    const ratio = (counts.get('beta') ?? 0) / (counts.get('alpha') ?? 1);
    expect(ratio).toBeGreaterThan(2.6);
    expect(ratio).toBeLessThan(3.4);
  });

  it('fails loudly on empty input', () => {
    expect(() => pickWeighted(1, [['alpha', 0]])).toThrow(RangeError);
    expect(() => pickOne(1, [])).toThrow(RangeError);
  });
});
