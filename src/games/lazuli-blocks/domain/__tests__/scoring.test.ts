import { describe, expect, it } from 'vitest';
import { DEFAULT_SCORING, scoreMove, streakMultiplier } from '../scoring';

const base = { placedCells: 4, clearedCells: 0, lines: 0, streak: 0, movesSinceClear: 0, perfectClear: false };

describe('scoreMove', () => {
  it('awards placement points only when nothing clears', () => {
    expect(scoreMove(DEFAULT_SCORING, base)).toEqual({ points: 4, coins: 0, streak: 0, movesSinceClear: 1 });
  });

  it('keeps a streak alive for a couple of misses, then breaks it', () => {
    const afterOneMiss = scoreMove(DEFAULT_SCORING, { ...base, streak: 2, movesSinceClear: 0 });
    expect(afterOneMiss.streak).toBe(2);
    const afterThirdMiss = scoreMove(DEFAULT_SCORING, { ...base, streak: 2, movesSinceClear: 2 });
    expect(afterThirdMiss.streak).toBe(0);
  });

  it('turns every cleared gem into a coin', () => {
    const result = scoreMove(DEFAULT_SCORING, { ...base, clearedCells: 11, lines: 1 });
    expect(result).toEqual({ points: 4 + 110, coins: 11, streak: 1, movesSinceClear: 0 });
  });

  it('rewards multi-line clears and streaks', () => {
    const result = scoreMove(DEFAULT_SCORING, { ...base, clearedCells: 23, lines: 2, streak: 2 });
    // streak becomes 3 → multiplier 2
    expect(result.streak).toBe(3);
    expect(result.points).toBe(4 + 23 * 10 * 2 * 2);
    expect(result.coins).toBe(23 + 5 + 2 * 3);
  });

  it('adds the perfect clear bonus', () => {
    const result = scoreMove(DEFAULT_SCORING, { ...base, clearedCells: 11, lines: 1, perfectClear: true });
    expect(result.points).toBe(4 + 110 + DEFAULT_SCORING.perfectClearPoints);
    expect(result.coins).toBe(11 + DEFAULT_SCORING.perfectClearCoins);
  });

  it('grows the multiplier by half a step per streak level', () => {
    expect([0, 1, 2, 3, 4].map(streakMultiplier)).toEqual([1, 1, 1.5, 2, 2.5]);
  });
});
