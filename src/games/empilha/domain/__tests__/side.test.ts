import { describe, expect, it } from 'vitest';
import { cellAt } from '@shared/domain/grid';
import { freeCells, openNeighbors, positionsWhere, topColorAt } from '../board';
import { boardTopColors, dealTray, randomStack } from '../dealer';
import { DEFAULT_RULES } from '../rules';
import { applyPlacement, canPlace, createSide, isStuck, legalMoves } from '../side';
import { runsFromTop } from '../stack';
import { TILE_COLORS } from '../tiles';
import { at, boardOf, codesAt, sideOf, tray } from './fixtures';

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

describe('side', () => {
  it('starts with a settled board, a locked centre and a full tray', () => {
    const side = createSide(2024, DEFAULT_RULES, 1);
    expect(cellAt(side.board, at(2, 2))).toEqual({ kind: 'locked', unlockAt: 90 });
    const stacks = positionsWhere(side.board, (cell) => cell.kind === 'open' && cell.stack.length > 0);
    expect(stacks).toHaveLength(DEFAULT_RULES.initialStacks);
    for (const position of stacks) {
      for (const next of openNeighbors(side.board, position)) {
        expect(topColorAt(side.board, next)).not.toBe(topColorAt(side.board, position));
      }
    }
    expect(side.tray.every((slot) => slot !== null)).toBe(true);
    expect(side.score).toBe(0);
  });

  it('refuses occupied, locked, outside and empty-slot placements', () => {
    const side = sideOf(boardOf(['ss _ L90', '. _ _']), tray('g', null, 'y'));
    expect(canPlace(side, 0, at(0, 0))).toBe(false);
    expect(canPlace(side, 0, at(2, 0))).toBe(false);
    expect(canPlace(side, 0, at(0, 1))).toBe(false);
    expect(canPlace(side, 1, at(1, 0))).toBe(false);
    expect(applyPlacement(side, 1, at(1, 0), DEFAULT_RULES, 1)).toBeNull();
    expect(canPlace(side, 0, at(1, 0))).toBe(true);
  });

  it('lands the stack, settles the board and empties the slot', () => {
    const side = sideOf(boardOf(['gsss _ _']), tray('ss', 'y', 'r'));
    const outcome = applyPlacement(side, 0, at(1, 0), DEFAULT_RULES, 1);
    expect(outcome).not.toBeNull();
    if (!outcome) return;
    expect(codesAt(outcome.landed, 1, 0)).toBe('ss');
    expect(codesAt(outcome.side.board, 0, 0)).toBe('gsssss');
    expect(codesAt(outcome.side.board, 1, 0)).toBe('');
    expect(outcome.side.tray.map((slot) => slot?.id ?? null)).toEqual([null, 101, 102]);
    expect(outcome.side.score).toBe(2);
    expect(outcome.side.moves).toBe(1);
    expect(outcome.dealt).toBe(false);
  });

  it('deals a new tray once the last stack is used', () => {
    const side = sideOf(boardOf(['_ _ _']), tray(null, 'gg', null));
    const outcome = applyPlacement(side, 1, at(0, 0), DEFAULT_RULES, 1);
    expect(outcome?.dealt).toBe(true);
    expect(outcome?.side.tray.every((slot) => slot !== null)).toBe(true);
    expect(outcome?.side.nextId).toBe(203);
  });

  it('unlocks cells when the score reaches their threshold', () => {
    const side = sideOf(boardOf(['_ ssssssss L90']), tray('ss', 'y', 'r'), 85);
    const outcome = applyPlacement(side, 0, at(0, 0), DEFAULT_RULES, 1);
    expect(outcome?.side.score).toBe(85 + 2 + 10);
    expect(outcome?.unlocked).toEqual([at(2, 0)]);
    expect(cellAt(outcome?.side.board ?? side.board, at(2, 0))).toEqual({ kind: 'open', stack: [] });
  });

  it('reports a full board as stuck', () => {
    const side = sideOf(boardOf(['gg yy _']), tray('rr', 'y', 'r'));
    expect(isStuck(side)).toBe(false);
    const outcome = applyPlacement(side, 0, at(2, 0), DEFAULT_RULES, 1);
    expect(outcome?.stuck).toBe(true);
    expect(freeCells(outcome?.side.board ?? side.board)).toEqual([]);
  });

  it('lists every legal move', () => {
    const side = sideOf(boardOf(['_ gg _']), tray('s', null, 'y'));
    expect(legalMoves(side)).toEqual([
      { slot: 0, at: at(0, 0) },
      { slot: 0, at: at(2, 0) },
      { slot: 2, at: at(0, 0) },
      { slot: 2, at: at(2, 0) },
    ]);
  });
});
