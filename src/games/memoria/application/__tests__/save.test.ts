import { describe, expect, it } from 'vitest';
import type { KeyValueStore } from '@shared/application/ports';
import { initialState, memoryReducer } from '../../domain/memory';
import { createMemoriaStore, restore } from '../save';

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

describe('memoria save', () => {
  it('persists and resumes a game in progress', () => {
    const backing = memoryStore();
    const first = createMemoriaStore(backing, () => 21);
    first.dispatch({ type: 'flip', index: 3 });
    const resumed = createMemoriaStore(backing, () => 999);
    expect(resumed.getState()).toEqual(first.getState());
  });

  it('survives a JSON round trip with progress and a best score', () => {
    let state = initialState(4, 17);
    state = memoryReducer(state, { type: 'flip', index: 0 });
    expect(restore(JSON.parse(JSON.stringify({ version: 1, best: 17, moves: 0, cards: state.game.cards.map((card) => `${card.cast}:${card.face[0]}`) })))).toEqual(state);
  });

  it('rejects malformed saves', () => {
    const good = { version: 1, best: null, moves: 2, cards: initialState(4).game.cards.map((card) => `${card.cast}:d`) };
    const broken: unknown[] = [
      null,
      { ...good, version: 2 },
      { ...good, moves: -1 },
      { ...good, best: 3 },
      { ...good, cards: good.cards.slice(1) },
      { ...good, cards: ['tata:d', ...good.cards.slice(1)] },
      { ...good, cards: good.cards.map((entry) => entry.replace(':d', ':x')) },
      { ...good, cards: good.cards.map((entry) => entry.replace(':d', ':u')) },
    ];
    for (const raw of broken) expect(restore(raw)).toBeNull();
    expect(restore(good)).not.toBeNull();
  });
});
