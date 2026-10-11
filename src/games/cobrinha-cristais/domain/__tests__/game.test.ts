import { describe, expect, it } from 'vitest';
import { createSnake, SIZE, spawnFood, stepSnake, turnSnake, type SnakeState } from '../game';

describe('Cobrinha de Cristais', () => {
  it('places food outside the body deterministically', () => {
    const game = createSnake(42);
    expect(game).toEqual(createSnake(42));
    expect(game.body).not.toContainEqual(game.food);
  });
  it('moves without changing length', () => {
    const game = { ...createSnake(42), food: { x: 0, y: 0 } };
    const next = stepSnake(game);
    expect(next.body[0]).toEqual({ x: 8, y: 8 });
    expect(next.body).toHaveLength(3);
  });
  it('grows and scores when eating a crystal', () => {
    const game = { ...createSnake(42), food: { x: 8, y: 8 } };
    const next = stepSnake(game);
    expect(next.body).toHaveLength(4);
    expect(next.score).toBe(10);
    expect(next.body).not.toContainEqual(next.food);
  });
  it('rejects a reversal, including two directions queued before a tick', () => {
    const game = createSnake(42);
    expect(turnSnake(game, 'left')).toBe(game);
    const up = turnSnake(game, 'up');
    expect(turnSnake(up, 'left')).toBe(up);
    expect(stepSnake(up).body[0]).toEqual({ x: 7, y: 7 });
  });
  it('ends on a wall collision', () => {
    const game = { ...createSnake(42), body: [{ x: SIZE - 1, y: 8 }] };
    expect(stepSnake(game).status).toBe('lost');
  });
  it('allows moving into the tail cell being vacated', () => {
    const game: SnakeState = { ...createSnake(42), direction: 'left', pending: 'down', food: { x: 0, y: 0 },
      body: [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 5, y: 6 }] };
    expect(stepSnake(game).status).toBe('playing');
    expect(stepSnake({ ...game, body: [...game.body, { x: 4, y: 6 }] }).status).toBe('lost');
  });
  it('has no food when every cell is occupied', () => {
    const body = Array.from({ length: SIZE * SIZE }, (_, i) => ({ x: i % SIZE, y: Math.floor(i / SIZE) }));
    expect(spawnFood(body, 1).food).toBeNull();
  });
  it('does not advance a finished game', () => {
    const game: SnakeState = { ...createSnake(1), status: 'lost' };
    expect(stepSnake(game)).toBe(game);
  });
});
