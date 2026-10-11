import { describe, expect, it } from 'vitest';
import { simulateDuel } from '../duel';
import { DEFAULT_RULES } from '../rules';

describe('simulateDuel', () => {
  it('is deterministic for a seed', () => {
    expect(simulateDuel(DEFAULT_RULES, 'raposa', 'puga', 77)).toEqual(simulateDuel(DEFAULT_RULES, 'raposa', 'puga', 77));
  });

  it('lets the sharpest rival beat the gentlest most of the time', () => {
    let wins = 0;
    for (let seed = 1; seed <= 24; seed += 1) {
      if (simulateDuel(DEFAULT_RULES, 'coruja', 'tata', seed * 31).winner === 'first') wins += 1;
    }
    expect(wins).toBeGreaterThanOrEqual(16);
  });
});
