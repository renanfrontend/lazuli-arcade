import { describe, expect, it } from 'vitest';
import { ANIMALS, createMemory, flipMemory, hideMismatch, memoryScore, type MemoryState } from '../game';

const ordered = (): MemoryState => ({ ...createMemory(1), cards: ANIMALS.flatMap((_, index) => [index, index]) });

describe('Memória dos Bichos', () => {
  it('deals exactly two of each animal with a reproducible shuffle', () => {
    const game = createMemory(42);
    expect(game).toEqual(createMemory(42));
    expect(game.cards).toHaveLength(16);
    for (let animal = 0; animal < ANIMALS.length; animal++) expect(game.cards.filter((id) => id === animal)).toHaveLength(2);
    expect(game.cards).not.toEqual(ordered().cards);
  });
  it('ignores repeated clicks and invalid indices', () => {
    const game = flipMemory(ordered(), 0);
    expect(flipMemory(game, 0)).toBe(game);
    expect(flipMemory(game, 99)).toBe(game);
    expect(game.moves).toBe(0);
  });
  it('counts a matched pair as one move and keeps it revealed', () => {
    const game = flipMemory(flipMemory(ordered(), 0), 1);
    expect(game.moves).toBe(1);
    expect(game.matched).toEqual([0]);
    expect(flipMemory(game, 1)).toBe(game);
  });
  it('locks a mismatch until it is hidden', () => {
    const game = flipMemory(flipMemory(ordered(), 0), 2);
    expect(game.selected).toEqual([0, 2]);
    expect(flipMemory(game, 4)).toBe(game);
    const hidden = hideMismatch(game);
    expect(hidden.selected).toEqual([]);
    expect(hidden.moves).toBe(1);
    expect(hideMismatch(flipMemory(hidden, 4)).selected).toEqual([4]);
  });
  it('finishes only when all pairs have been found', () => {
    let game = ordered();
    for (let i = 0; i < 16; i++) game = flipMemory(game, i);
    expect(game.won).toBe(true);
    expect(game.moves).toBe(8);
    expect(game.matched).toHaveLength(8);
    expect(memoryScore(game.moves)).toBeGreaterThan(memoryScore(20));
    expect(memoryScore(500)).toBe(100);
  });
});
