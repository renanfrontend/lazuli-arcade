import { describe, expect, it } from 'vitest';
import { stickVector } from './stick';

describe('stickVector', () => {
  it('ignores the dead zone and invalid input', () => {
    expect(stickVector(3, 2, 50)).toEqual({ x: 0, y: 0 });
    expect(stickVector(Number.NaN, 10, 50)).toEqual({ x: 0, y: 0 });
    expect(stickVector(10, 10, 0)).toEqual({ x: 0, y: 0 });
  });
  it('is analog: half deflection walks slower than full, and up means forward', () => {
    const half = stickVector(0, -25, 50), full = stickVector(0, -50, 50);
    expect(half.y).toBeGreaterThan(0);
    expect(half.y).toBeLessThan(full.y);
    expect(full).toEqual({ x: 0, y: 1 });
    expect(stickVector(50, 0, 50).x).toBe(1);
    expect(stickVector(0, 50, 50).y).toBe(-1);
  });
});
