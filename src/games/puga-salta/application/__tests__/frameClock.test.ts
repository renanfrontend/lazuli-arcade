import { describe, expect, it } from 'vitest';
import { advanceFrame } from '../frameClock';

describe('Puga fixed physics clock', () => {
  it.each([30, 60, 90, 120, 144])('runs 60 physics steps per second on a %i Hz display', (hz) => {
    let remainder = 0;
    let steps = 0;
    for (let frame = 0; frame < hz; frame++) {
      const result = advanceFrame(remainder, 1000 / hz);
      remainder = result.remainder;
      steps += result.steps;
    }
    expect(steps).toBe(60);
    expect(remainder).toBeCloseTo(0);
  });

  it('caps catch-up after a stalled frame', () => {
    expect(advanceFrame(0, 5000).steps).toBe(6);
  });
});
