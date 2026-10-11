import { describe, expect, it } from 'vitest';
import { cellAt } from '@shared/domain/grid';
import { openNeighbors, positionsWhere, topColorAt } from '../board';
import { boardTopColors, dealTray, randomStack } from '../dealer';
import { DEFAULT_RULES } from '../rules';
import { applyPlacement, canPlace, createHand, legalMoves, seedBoard } from '../hand';
import { runsFromTop } from '../stack';
import { TILE_COLORS } from '../tiles';
import { at, boardOf, codesAt, handOf, tray } from './fixtures';

describe('dealer', () => {
  it('builds stacks of 2 to 6 tiles in at most 3 runs from the palette', () => {
    let seed = 9;
    const palette = TILE_COLORS.slice(0, 5);
    for (let i = 0; i < 300; i += 1) {
      const stack = randomStack(seed, DEFAULT_RULES.recipe, palette);
      seed = stack.seed;
      expect(stack.value.length).toBeGreaterThanOrEqual(2);
      expect(stack.value.length).toBeLessThanOrEqual(6);
      expect(runsFromTop(stack.value).length).toBeLessThanOrEqual(3);
      for (const color of stack.value) expect(palette).toContain(color);
    }
  });

  it('favours top colors already on the board', () => {
    const board = boardOf(['ll _ ll', '_ _ _']);
    expect(boardTopColors(board)).toEqual(['leaf', 'leaf']);
    let seed = 3;
    let leafOnTop = 0;
    for (let i = 0; i < 400; i += 1) {
      const deal = dealTray(seed, { board, recipe: DEFAULT_RULES.recipe, palette: TILE_COLORS, size: 1, nextId: 1 });
      seed = deal.seed;
      if (deal.tray[0]?.tiles.at(-1) === 'leaf') leafOnTop += 1;
    }
    // ~55% preferred plus the uniform share of the rest.
    expect(leafOnTop / 400).toBeGreaterThan(0.5);
  });

  it('deals deterministically with sequential ids', () => {
    const options = { board: boardOf(['_ _']), recipe: DEFAULT_RULES.recipe, palette: TILE_COLORS, size: 3, nextId: 7 };
    const a = dealTray(42, options);
    expect(a).toEqual(dealTray(42, options));
    expect(a.tray.map((stack) => stack.id)).toEqual([7, 8, 9]);
    expect(a.nextId).toBe(10);
  });
});

describe('hand', () => {
  it('starts with a settled shared board, a locked centre and a full tray', () => {
    const { board } = seedBoard(2024, DEFAULT_RULES, 1);
    const hand = createHand(7, board, DEFAULT_RULES, 1);
    expect(cellAt(board, at(2, 2))).toEqual({ kind: 'locked', unlockAt: 100 });
    const stacks = positionsWhere(board, (cell) => cell.kind === 'open' && cell.stack.length > 0);
    expect(stacks).toHaveLength(DEFAULT_RULES.initialStacks);
    for (const position of stacks) {
      for (const next of openNeighbors(board, position)) {
        expect(topColorAt(board, next)).not.toBe(topColorAt(board, position));
      }
    }
    expect(hand.tray.every((slot) => slot !== null)).toBe(true);
    expect(hand.score).toBe(0);
  });

  it('refuses occupied, locked, outside and empty-slot placements', () => {
    const board = boardOf(['ss _ L90', '. _ _']);
    const hand = handOf(tray('g', null, 'y'));
    expect(canPlace(board, hand, 0, at(0, 0))).toBe(false);
    expect(canPlace(board, hand, 0, at(2, 0))).toBe(false);
    expect(canPlace(board, hand, 0, at(0, 1))).toBe(false);
    expect(canPlace(board, hand, 1, at(1, 0))).toBe(false);
    expect(applyPlacement(board, hand, 1, at(1, 0), 0, DEFAULT_RULES, 1)).toBeNull();
    expect(canPlace(board, hand, 0, at(1, 0))).toBe(true);
  });

  it('lands the stack, settles the shared board and empties the slot', () => {
    const outcome = applyPlacement(boardOf(['gsss _ _']), handOf(tray('ss', 'y', 'r')), 0, at(1, 0), 0, DEFAULT_RULES, 1);
    expect(outcome).not.toBeNull();
    if (!outcome) return;
    expect(codesAt(outcome.landed, 1, 0)).toBe('ss');
    expect(codesAt(outcome.board, 0, 0)).toBe('gsssss');
    expect(codesAt(outcome.board, 1, 0)).toBe('');
    expect(outcome.hand.tray.map((slot) => slot?.id ?? null)).toEqual([null, 101, 102]);
    expect(outcome.hand.score).toBe(2);
    expect(outcome.hand.moves).toBe(1);
    expect(outcome.dealt).toBe(false);
  });

  it('deals a new tray once the last stack is used', () => {
    const outcome = applyPlacement(boardOf(['_ _ _']), handOf(tray(null, 'gg', null)), 1, at(0, 0), 0, DEFAULT_RULES, 1);
    expect(outcome?.dealt).toBe(true);
    expect(outcome?.hand.tray.every((slot) => slot !== null)).toBe(true);
    expect(outcome?.hand.nextId).toBe(203);
  });

  it('unlocks cells on the points of both players together', () => {
    const board = boardOf(['_ ssssssss L90']);
    const outcome = applyPlacement(board, handOf(tray('ss', 'y', 'r'), 30), 0, at(0, 0), 55, DEFAULT_RULES, 1);
    expect(outcome?.hand.score).toBe(30 + 2 + 10);
    expect(outcome?.unlocked).toEqual([at(2, 0)]);
    expect(cellAt(outcome?.board ?? board, at(2, 0))).toEqual({ kind: 'open', stack: [] });
  });

  it('lists every legal move', () => {
    expect(legalMoves(boardOf(['_ gg _']), handOf(tray('s', null, 'y')))).toEqual([
      { slot: 0, at: at(0, 0) },
      { slot: 0, at: at(2, 0) },
      { slot: 2, at: at(0, 0) },
      { slot: 2, at: at(2, 0) },
    ]);
  });
});
