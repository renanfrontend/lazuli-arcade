import { describe, expect, it } from 'vitest';
import type { KeyValueStore } from '@shared/application/ports';
import { initialState, pourAmount } from '../../domain/frascos';
import { createFrascosStore, restore } from '../save';

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

describe('frascos save', () => {
  it('resumes the level with moves and undo history', () => {
    const backing = memoryStore();
    const first = createFrascosStore(backing, () => 12);
    const { flasks } = first.getState().game;
    const move = flasks.flatMap((_, from) => flasks.map((__, to) => ({ from, to }))).find(({ from, to }) => pourAmount(flasks, from, to) > 0);
    if (!move) throw new Error('fixture needs a move');
    first.dispatch({ type: 'pour', ...move });
    const resumed = createFrascosStore(backing, () => 999);
    expect(resumed.getState()).toEqual(first.getState());
    expect(resumed.getState().game.history).toHaveLength(1);
  });

  it('rejects malformed saves', () => {
    const state = initialState(3);
    const good = JSON.parse(
      JSON.stringify({
        version: 1,
        level: 1,
        seed: 3,
        moves: 0,
        start: state.game.start.map((flask) => flask.join('')),
        flasks: state.game.flasks.map((flask) => flask.join('')),
        history: [],
      }),
    ) as Record<string, unknown>;
    expect(restore(good)).not.toBeNull();
    const broken: unknown[] = [
      null,
      { ...good, version: 2 },
      { ...good, level: 0 },
      { ...good, seed: -1 },
      { ...good, flasks: (good.flasks as string[]).slice(1) },
      { ...good, flasks: (good.flasks as string[]).map(() => '0000') },
      { ...good, flasks: (good.flasks as string[]).map((flask) => `${flask}0`) },
      { ...good, flasks: (good.flasks as string[]).map((flask) => flask.replace(/\d/, '9')) },
      { ...good, history: [['x']] },
      { ...good, level: 3 },
    ];
    for (const raw of broken) expect(restore(raw)).toBeNull();
  });
});
