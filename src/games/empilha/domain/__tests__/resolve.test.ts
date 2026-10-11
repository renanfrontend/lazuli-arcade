import { describe, expect, it } from 'vitest';
import { nextInt, type Seed } from '@shared/domain/rng';
import { freeCells, openNeighbors, topColorAt, withStack, type Board } from '../board';
import { randomStack } from '../dealer';
import { resolveFrom } from '../resolve';
import { DEFAULT_RULES } from '../rules';
import { TILE_COLORS } from '../tiles';
import { at, boardOf, codesAt, stackOf, tileCount } from './fixtures';

const SETTLE = { clearAt: 10, mergePoints: 1 };

describe('resolveFrom', () => {
  it('leaves a lone stack alone', () => {
    const board = withStack(boardOf(['_ g _']), at(0, 0), stackOf('ss'));
    const result = resolveFrom(board, at(0, 0), SETTLE);
    expect(result.steps).toEqual([]);
    expect(result.points).toBe(0);
  });

  it('flows tiles hop by hop into the stack holding the longest run', () => {
    // A (1 sky) — B (placed, 2 sky) — C (4 sky on a sun): everything ends on C.
    const board = withStack(boardOf(['gs _ yssss']), at(1, 0), stackOf('ss'));
    const result = resolveFrom(board, at(1, 0), SETTLE);

    expect(result.steps.map((step) => [step.type, step.type === 'merge' ? step.from.col : -1, step.count])).toEqual([
      ['merge', 0, 1],
      ['merge', 1, 3],
    ]);
    expect(codesAt(result.board, 0, 0)).toBe('g');
    expect(codesAt(result.board, 1, 0)).toBe('');
    expect(codesAt(result.board, 2, 0)).toBe('ysssssss');
    expect(result.points).toBe(4);
    expect(result.tilesMoved).toBe(4);
  });

  it('breaks ties in favour of the stack just placed', () => {
    const board = withStack(boardOf(['ss _']), at(1, 0), stackOf('gss'));
    const result = resolveFrom(board, at(1, 0), SETTLE);
    expect(codesAt(result.board, 0, 0)).toBe('');
    expect(codesAt(result.board, 1, 0)).toBe('gssss');
  });

  it('clears a run that reaches the threshold and cascades with a growing multiplier', () => {
    // B gets 4 sky → C reaches 10 sky and clears (×1); C now shows 6 grapes, pulls D's 4 and clears again (×2).
    const board = withStack(boardOf(['_ ggggggssssss gggg']), at(0, 0), stackOf('ssss'));
    const result = resolveFrom(board, at(0, 0), SETTLE);

    expect(
      result.steps.map((step) =>
        step.type === 'clear' ? `clear ${step.color} ${step.count} x${step.chain}` : `merge ${step.color} ${step.count}`,
      ),
    ).toEqual(['merge sky 4', 'clear sky 10 x1', 'merge grape 4', 'clear grape 10 x2']);
    expect(result.points).toBe(4 + 10 + 4 + 20);
    expect(result.clears).toBe(2);
    expect(result.tilesCleared).toBe(20);
    expect(tileCount(result.board)).toBe(0);
  });

  it('exposes the board after every step for animation', () => {
    const board = withStack(boardOf(['_ ssssssss']), at(0, 0), stackOf('ss'));
    const result = resolveFrom(board, at(0, 0), SETTLE);
    const [merge, clear] = result.steps;
    expect(merge?.type).toBe('merge');
    expect(codesAt(merge?.board ?? board, 1, 0)).toBe('ssssssssss');
    expect(clear?.type).toBe('clear');
    expect(codesAt(clear?.board ?? board, 1, 0)).toBe('');
  });

  it('ignores locked and void cells when looking for neighbours', () => {
    const board = withStack(boardOf(['_ L90 ssss', '. ss .']), at(0, 0), stackOf('s'));
    const result = resolveFrom(board, at(0, 0), SETTLE);
    expect(result.steps).toEqual([]);
  });

  it('keeps the board settled and conserves tiles over random placements', () => {
    let seed: Seed = 77;
    const roll = (max: number) => {
      const result = nextInt(seed, max);
      seed = result.seed;
      return result.value;
    };

    for (let game = 0; game < 60; game += 1) {
      let board: Board = boardOf(['_ _ _ _ _', '_ _ _ _ _', '_ _ L50 _ _', '_ _ _ _ _', '_ _ _ _ _']);
      for (let move = 0; move < 30; move += 1) {
        const free = freeCells(board);
        if (free.length === 0) break;
        const spot = free[roll(free.length)];
        if (!spot) break;
        const stack = randomStack(seed, DEFAULT_RULES.recipe, TILE_COLORS.slice(0, 4));
        seed = stack.seed;
        const before = tileCount(board) + stack.value.length;
        const result = resolveFrom(withStack(board, spot, stack.value), spot, SETTLE);
        board = result.board;

        expect(tileCount(board) + result.tilesCleared).toBe(before);
        for (const step of result.steps) {
          if (step.type === 'merge') expect(Math.abs(step.from.col - step.to.col) + Math.abs(step.from.row - step.to.row)).toBe(1);
          else expect(step.count).toBeGreaterThanOrEqual(SETTLE.clearAt);
        }
        for (let index = 0; index < board.cells.length; index += 1) {
          const position = at(index % board.cols, Math.floor(index / board.cols));
          const color = topColorAt(board, position);
          if (!color) continue;
          for (const next of openNeighbors(board, position)) expect(topColorAt(board, next)).not.toBe(color);
        }
      }
    }
  });
});
