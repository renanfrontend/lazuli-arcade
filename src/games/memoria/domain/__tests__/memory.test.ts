import { describe, expect, it } from 'vitest';
import { CAST_IDS } from '@shared/cast/cast';
import { createGame, initialState, isWon, matchedPairs, memoryReducer, needsSettle, PAIRS, type MemoriaState } from '../memory';

const indexesOf = (state: MemoriaState, cast: string) => state.game.cards.flatMap((card, index) => (card.cast === cast ? [index] : []));

describe('memory', () => {
  it('deals two of each cast member, face down, deterministically', () => {
    const game = createGame(11);
    expect(game.cards).toHaveLength(PAIRS * 2);
    for (const id of CAST_IDS) expect(game.cards.filter((card) => card.cast === id)).toHaveLength(2);
    expect(game.cards.every((card) => card.face === 'down')).toBe(true);
    expect(createGame(11)).toEqual(game);
    expect(createGame(12).cards.map((card) => card.cast)).not.toEqual(game.cards.map((card) => card.cast));
  });

  it('counts a move per pair of flips and blocks a third flip', () => {
    let state = initialState(5);
    const [a, b] = indexesOf(state, 'tata');
    const other = indexesOf(state, 'lobo')[0];
    if (a === undefined || b === undefined || other === undefined) throw new Error('fixture');
    state = memoryReducer(state, { type: 'flip', index: a });
    expect(state.game.moves).toBe(0);
    state = memoryReducer(state, { type: 'flip', index: b });
    expect(state.game.moves).toBe(1);
    expect(needsSettle(state.game)).toBe(true);
    expect(memoryReducer(state, { type: 'flip', index: other })).toBe(state);
    expect(memoryReducer(state, { type: 'flip', index: a })).toBe(state);
  });

  it('keeps matches and turns misses back', () => {
    let state = initialState(5);
    const [a, b] = indexesOf(state, 'tata');
    const c = indexesOf(state, 'lobo')[0];
    if (a === undefined || b === undefined || c === undefined) throw new Error('fixture');
    for (const index of [a, b]) state = memoryReducer(state, { type: 'flip', index });
    state = memoryReducer(state, { type: 'settle' });
    expect(matchedPairs(state.game)).toBe(1);
    for (const index of [a, c]) state = memoryReducer(state, { type: 'flip', index });
    expect(state.game.cards[a]?.face).toBe('matched');
    state = memoryReducer(state, { type: 'flip', index: c });
    state = memoryReducer(state, { type: 'flip', index: indexesOf(state, 'coruja')[0] ?? 0 });
    state = memoryReducer(state, { type: 'settle' });
    expect(state.game.cards[c]?.face).toBe('down');
    expect(memoryReducer(state, { type: 'settle' })).toBe(state);
  });

  it('wins after every pair and remembers the fewest moves', () => {
    let state = initialState(9, 30);
    for (const id of CAST_IDS) {
      for (const index of indexesOf(state, id)) state = memoryReducer(state, { type: 'flip', index });
      state = memoryReducer(state, { type: 'settle' });
    }
    expect(isWon(state.game)).toBe(true);
    expect(state.game.moves).toBe(PAIRS);
    expect(state.best).toBe(PAIRS);
    const again = memoryReducer(state, { type: 'newGame', seed: 3 });
    expect(again.best).toBe(PAIRS);
    expect(again.game.moves).toBe(0);
    expect(memoryReducer(state, { type: 'flip', index: 0 })).toBe(state);
  });
});
