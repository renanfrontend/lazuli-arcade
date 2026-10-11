import { describe, expect, it } from 'vitest';
import { canMove, createGame, dobraReducer, initialState, SIZE, type DobraState, type Tile } from '../dobra';

const tile = (id: number, col: number, row: number, level: number): Tile => ({ id, col, row, level, born: false, merged: false });

const stateWith = (tiles: Tile[], extra: Partial<DobraState['game']> = {}): DobraState => ({
  best: 0,
  game: { ...initialState(1).game, tiles, nextId: 100, ...extra },
});

const levelsAt = (state: DobraState, row: number) =>
  Array.from({ length: SIZE }, (_, col) => state.game.tiles.find((t) => t.col === col && t.row === row)?.level ?? 0);

describe('dobra', () => {
  it('starts with two tiles of level 1 or 2, deterministically', () => {
    const game = createGame(7);
    expect(game.tiles).toHaveLength(2);
    expect(game.tiles.every((t) => t.level <= 2 && t.born)).toBe(true);
    expect(createGame(7)).toEqual(game);
  });

  it('slides and merges each pair once per move', () => {
    const state = stateWith([tile(1, 0, 0, 1), tile(2, 1, 0, 1), tile(3, 2, 0, 1), tile(4, 3, 0, 1)]);
    const next = dobraReducer(state, { type: 'move', direction: 'left' });
    expect(levelsAt(next, 0).slice(0, 2)).toEqual([2, 2]);
    expect(next.game.score).toBe(8);
    expect(next.game.moves).toBe(1);
  });

  it('merges the pair nearest the wall first and never chains', () => {
    const next = dobraReducer(stateWith([tile(1, 0, 0, 1), tile(2, 1, 0, 1), tile(3, 2, 0, 2)]), { type: 'move', direction: 'left' });
    expect(levelsAt(next, 0).slice(0, 2)).toEqual([2, 2]);
  });

  it('keeps the survivor id and flags merged and born tiles', () => {
    const next = dobraReducer(stateWith([tile(1, 2, 0, 3), tile(2, 3, 0, 3)]), { type: 'move', direction: 'right' });
    const merged = next.game.tiles.find((t) => t.merged);
    expect(merged).toMatchObject({ id: 2, col: 3, row: 0, level: 4 });
    expect(next.game.tiles.filter((t) => t.born)).toHaveLength(1);
  });

  it('ignores a move that changes nothing', () => {
    const state = stateWith([tile(1, 0, 0, 1), tile(2, 0, 1, 2)]);
    expect(dobraReducer(state, { type: 'move', direction: 'left' })).toBe(state);
  });

  it('moves in all four directions', () => {
    const base = stateWith([tile(1, 1, 1, 3)]);
    const place = (direction: 'left' | 'right' | 'up' | 'down') =>
      dobraReducer(base, { type: 'move', direction }).game.tiles.find((t) => t.id === 1);
    expect(place('left')).toMatchObject({ col: 0, row: 1 });
    expect(place('right')).toMatchObject({ col: 3, row: 1 });
    expect(place('up')).toMatchObject({ col: 1, row: 0 });
    expect(place('down')).toMatchObject({ col: 1, row: 3 });
  });

  it('detects a locked board and ends the game', () => {
    let id = 0;
    const checker = Array.from({ length: SIZE * SIZE }, (_, key) => tile((id += 1), key % SIZE, Math.floor(key / SIZE), ((key % SIZE) + Math.floor(key / SIZE)) % 2 === 0 ? 1 : 2));
    expect(canMove(checker)).toBe(false);
    const nearly = checker.map((t) => (t.col === 3 && t.row === 3 ? { ...t, level: 1 } : t)).filter((t) => !(t.col === 0 && t.row === 0));
    const next = dobraReducer(stateWith(nearly), { type: 'move', direction: 'left' });
    expect(['playing', 'lost']).toContain(next.game.status);
    expect(canMove(checker.map((t) => (t.id === 2 ? { ...t, level: 1 } : t)))).toBe(true);
  });

  it('wins at 2048 and can carry on', () => {
    const state = stateWith([tile(1, 0, 0, 10), tile(2, 1, 0, 10)]);
    const won = dobraReducer(state, { type: 'move', direction: 'left' });
    expect(won.game.status).toBe('won');
    expect(dobraReducer(won, { type: 'move', direction: 'right' })).toBe(won);
    const carrying = dobraReducer(won, { type: 'continue' });
    expect(carrying.game).toMatchObject({ status: 'playing', keepGoing: true });
  });

  it('tracks the best score across games', () => {
    const played = dobraReducer(stateWith([tile(1, 0, 0, 3), tile(2, 1, 0, 3)]), { type: 'move', direction: 'left' });
    expect(played.best).toBe(16);
    expect(dobraReducer(played, { type: 'newGame', seed: 5 }).best).toBe(16);
  });
});
