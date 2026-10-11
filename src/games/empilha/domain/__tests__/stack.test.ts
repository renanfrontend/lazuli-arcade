import { describe, expect, it } from 'vitest';
import { runsFromTop, splitTopRun, stackFromRuns, topColor, topRunLength } from '../stack';
import { codesOf, stackOf } from './fixtures';

describe('stack', () => {
  it('reads the top color and the length of its run', () => {
    expect(topColor(stackOf('ggsss'))).toBe('sky');
    expect(topRunLength(stackOf('ggsss'))).toBe(3);
    expect(topColor([])).toBeNull();
    expect(topRunLength([])).toBe(0);
  });

  it('splits off only the uppermost run', () => {
    const { rest, run } = splitTopRun(stackOf('ssggs'));
    expect(codesOf(rest)).toBe('ssgg');
    expect(codesOf(run)).toBe('s');
  });

  it('lists runs from the top and rebuilds the same stack', () => {
    const stack = stackOf('yyyggsrr');
    expect(runsFromTop(stack)).toEqual([
      { color: 'rose', count: 2 },
      { color: 'sky', count: 1 },
      { color: 'grape', count: 2 },
      { color: 'sun', count: 3 },
    ]);
    expect(stackFromRuns(runsFromTop(stack))).toEqual(stack);
  });
});
