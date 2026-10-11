import { describe, expect, it } from 'vitest';
import {
  CAPACITY,
  colorsForLevel,
  createGame,
  createPuzzle,
  frascosReducer,
  initialState,
  isSolvable,
  isSolved,
  pour,
  pourAmount,
  type Flasks,
} from '../frascos';

const f = (...flasks: string[]): Flasks => flasks.map((flask) => Array.from(flask, Number));

describe('frascos', () => {
  it('pours the top run onto an empty flask or the same color', () => {
    const flasks = f('0011', '', '1', '0');
    expect(pour(flasks, 0, 1)).toEqual(f('00', '11', '1', '0'));
    expect(pour(flasks, 0, 2)).toEqual(f('00', '', '111', '0'));
    expect(pourAmount(flasks, 0, 3)).toBe(0);
    expect(pour(flasks, 1, 0)).toBeNull();
    expect(pour(flasks, 0, 0)).toBeNull();
  });

  it('only moves what fits', () => {
    const flasks = f('0111', '11', '', '0');
    expect(pourAmount(flasks, 0, 1)).toBe(2);
    expect(pour(flasks, 0, 1)).toEqual(f('01', '1111', '', '0'));
    expect(pourAmount(f('1111', '1'), 1, 0)).toBe(0);
  });

  it('knows when a puzzle is solved', () => {
    expect(isSolved(f('1111', '', '0000'))).toBe(true);
    expect(isSolved(f('111', '1', '0000'))).toBe(false);
    expect(isSolved(f('0011', '', ''))).toBe(false);
  });

  it('solves small puzzles with the search', () => {
    expect(isSolvable(f('0101', '1010', '', ''))).toBe(true);
    expect(isSolvable(f('0101', '1010', '0', '1'))).toBe(false);
  });

  it('grows with the level up to eight colors', () => {
    expect([1, 2, 6, 9].map(colorsForLevel)).toEqual([3, 4, 8, 8]);
  });

  it('builds solvable, unsolved, balanced puzzles for every level', () => {
    for (let level = 1; level <= 8; level += 1) {
      for (const seed of [1, 77, 4242]) {
        const { flasks } = createPuzzle(level, seed);
        const colors = colorsForLevel(level);
        expect(flasks).toHaveLength(colors + 2);
        expect(isSolved(flasks)).toBe(false);
        for (let color = 0; color < colors; color += 1) {
          expect(flasks.flat().filter((c) => c === color)).toHaveLength(CAPACITY);
        }
        expect(isSolvable(flasks)).toBe(true);
      }
    }
  });

  it('is deterministic for a seed', () => {
    expect(createGame(3, 9)).toEqual(createGame(3, 9));
  });

  it('counts moves, undoes them and restarts', () => {
    let state = initialState(5);
    const first = state.game.flasks;
    const move = first.flatMap((_, from) => first.map((__, to) => ({ from, to }))).find(({ from, to }) => pourAmount(first, from, to) > 0);
    if (!move) throw new Error('fixture needs a move');
    state = frascosReducer(state, { type: 'pour', ...move });
    expect(state.game.moves).toBe(1);
    expect(frascosReducer(state, { type: 'undo' }).game).toMatchObject({ flasks: first, moves: 0 });
    expect(frascosReducer(state, { type: 'restart' }).game.flasks).toEqual(state.game.start);
    expect(frascosReducer(initialState(5), { type: 'undo' }).game.moves).toBe(0);
  });

  it('only moves on to the next level once solved', () => {
    const state = initialState(5);
    expect(frascosReducer(state, { type: 'nextLevel', seed: 1 })).toBe(state);
    const solved = { ...state, game: { ...state.game, flasks: f('000', '').map((flask, i) => (i === 0 ? [0, 0, 0, 0] : flask)).concat([[1, 1, 1, 1], [2, 2, 2, 2]]) } };
    expect(isSolved(solved.game.flasks)).toBe(true);
    const next = frascosReducer(solved, { type: 'nextLevel', seed: 8 });
    expect(next.level).toBe(2);
    expect(next.game.moves).toBe(0);
    expect(frascosReducer(solved, { type: 'pour', from: 0, to: 4 })).toBe(solved);
  });
});
