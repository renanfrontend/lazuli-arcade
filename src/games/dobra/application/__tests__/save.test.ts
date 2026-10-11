import { describe, expect, it } from 'vitest';
import type { KeyValueStore } from '@shared/application/ports';
import { initialState } from '../../domain/dobra';
import { createDobraStore, restore } from '../save';

const memoryStore = (): KeyValueStore => {
  const data = new Map<string, string>();
  return {
    read: (key) => {
      const raw = data.get(key);
      return raw === undefined ? undefined : (JSON.parse(raw) as unknown);
    },
    write: (key, value) => {
      data.set(key, JSON.stringify(value));
    },
  };
};

describe('dobra save', () => {
  it('resumes the game in progress', () => {
    const backing = memoryStore();
    const first = createDobraStore(backing, () => 5);
    for (const direction of ['left', 'up', 'right', 'down'] as const) first.dispatch({ type: 'move', direction });
    const resumed = createDobraStore(backing, () => 999);
    expect(resumed.getState().game.tiles.map(({ id, col, row, level }) => ({ id, col, row, level }))).toEqual(
      first.getState().game.tiles.map(({ id, col, row, level }) => ({ id, col, row, level })),
    );
    expect(resumed.getState().game.score).toBe(first.getState().game.score);
  });

  it('rejects malformed saves', () => {
    const good = { version: 1, best: 0, score: 0, moves: 0, status: 'playing', keepGoing: false, seed: 1, nextId: 5, tiles: [[1, 0, 0, 1], [2, 1, 0, 2]] };
    expect(restore(good)).not.toBeNull();
    const broken: unknown[] = [
      null,
      { ...good, version: 2 },
      { ...good, status: 'paused' },
      { ...good, keepGoing: 'no' },
      { ...good, tiles: [] },
      { ...good, tiles: [[1, 0, 0, 1], [2, 0, 0, 2]] },
      { ...good, tiles: [[1, 4, 0, 1]] },
      { ...good, tiles: [[1, 0, 0, 0]] },
      { ...good, tiles: [[9, 0, 0, 1]] },
      { ...good, seed: 2 ** 40 },
    ];
    for (const raw of broken) expect(restore(raw)).toBeNull();
  });

  it('keeps the best score at least as high as the saved score', () => {
    expect(restore({ version: 1, best: 4, score: 12, moves: 3, status: 'playing', keepGoing: false, seed: 1, nextId: 5, tiles: [[1, 0, 0, 1]] })?.best).toBe(12);
    expect(initialState(3).best).toBe(0);
  });
});
