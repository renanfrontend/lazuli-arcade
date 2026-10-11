import { describe, expect, it } from 'vitest';
import type { KeyValueStore } from '../ports';
import { readRecord, saveRecord } from '../records';

describe('arcade records', () => {
  it('sanitizes invalid or corrupt stored data', () => {
    for (const value of [undefined, null, 'bad', { best: NaN, games: -2 }, { best: Infinity, games: '2' }]) {
      const store: KeyValueStore = { read: () => value, write: () => undefined };
      expect(readRecord(store)).toEqual({ best: 0, games: 0 });
    }
  });
  it('retains the highest score and counts completed games', () => {
    let stored: unknown;
    const store: KeyValueStore = { read: () => stored, write: (_key, value) => { stored = value; } };
    expect(saveRecord(store, 80)).toEqual({ best: 80, games: 1 });
    expect(saveRecord(store, 20)).toEqual({ best: 80, games: 2 });
    expect(readRecord(store)).toEqual({ best: 80, games: 2 });
  });
});
