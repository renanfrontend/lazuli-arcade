import { samePosition, type Position } from '@shared/domain/grid';
import { nextInt, type Seed } from '@shared/domain/rng';
import {
  boardFromLayout,
  freeCells,
  isFreeCell,
  openNeighbors,
  topColorAt,
  unlockReached,
  withStack,
  type Board,
} from './board';
import { dealTray, randomStack, type TraySlot } from './dealer';
import { resolveFrom, type Resolution } from './resolve';
import type { Rules } from './rules';
import { topColor } from './stack';

/** One player's half of a match: a board, a tray of three stacks and a score. */
export interface Side {
  readonly board: Board;
  readonly tray: readonly TraySlot[];
  readonly score: number;
  readonly moves: number;
  readonly seed: Seed;
  readonly nextId: number;
}

export interface PlacementOutcome {
  readonly side: Side;
  /** The board the moment the stack lands, before anything merges. */
  readonly landed: Board;
  readonly resolution: Resolution;
  readonly unlocked: readonly Position[];
  readonly dealt: boolean;
  /** No free cell left: this side cannot move any more. */
  readonly stuck: boolean;
}

/** Seeds a few stacks so the first moves already have neighbours to merge with. */
const seedBoard = (board: Board, seed: Seed, rules: Rules, level: number): { board: Board; seed: Seed } => {
  let current = seed;
  let result = board;
  const palette = rules.palette(level);
  for (let placed = 0, attempts = 0; placed < rules.initialStacks && attempts < 60; attempts += 1) {
    const free = freeCells(result);
    if (free.length === 0) break;
    const spot = nextInt(current, free.length);
    current = spot.seed;
    const position = free[spot.value];
    const stack = randomStack(current, rules.recipe, palette);
    current = stack.seed;
    const top = topColor(stack.value);
    // Keep the starting board settled: no neighbours with the same top color.
    if (!position || openNeighbors(result, position).some((next) => topColorAt(result, next) === top)) continue;
    result = withStack(result, position, stack.value);
    placed += 1;
  }
  return { board: result, seed: current };
};

export const createSide = (seed: Seed, rules: Rules, level: number): Side => {
  const seeded = seedBoard(boardFromLayout(rules.layout), seed, rules, level);
  const deal = dealTray(seeded.seed, {
    board: seeded.board,
    recipe: rules.recipe,
    palette: rules.palette(level),
    size: rules.traySize,
    nextId: 1,
  });
  return { board: seeded.board, tray: deal.tray, score: 0, moves: 0, seed: deal.seed, nextId: deal.nextId };
};

export const canPlace = (side: Side, slot: number, at: Position): boolean =>
  side.tray[slot] != null && isFreeCell(side.board, at);

export const isStuck = (side: Side): boolean => freeCells(side.board).length === 0;

/** Drops a tray stack on a free cell and settles everything that follows. Returns null for illegal moves. */
export const applyPlacement = (
  side: Side,
  slot: number,
  at: Position,
  rules: Rules,
  level: number,
): PlacementOutcome | null => {
  const stack = side.tray[slot];
  if (!stack || !isFreeCell(side.board, at)) return null;

  const landed = withStack(side.board, at, stack.tiles);
  const resolution = resolveFrom(landed, at, rules.settle);
  const score = side.score + resolution.points;
  const { board, unlocked } = unlockReached(resolution.board, score);

  let tray: readonly TraySlot[] = side.tray.map((entry, index) => (index === slot ? null : entry));
  let { seed, nextId } = side;
  const dealt = tray.every((entry) => entry === null);
  if (dealt) {
    const deal = dealTray(seed, { board, recipe: rules.recipe, palette: rules.palette(level), size: rules.traySize, nextId });
    ({ tray, seed, nextId } = deal);
  }

  const next: Side = { board, tray, score, moves: side.moves + 1, seed, nextId };
  return { side: next, landed, resolution, unlocked, dealt, stuck: isStuck(next) };
};

/** Every legal (slot, cell) pair, slots in tray order and cells in reading order. */
export const legalMoves = (side: Side): { readonly slot: number; readonly at: Position }[] => {
  const free = freeCells(side.board);
  return side.tray.flatMap((entry, slot) => (entry ? free.map((at) => ({ slot, at })) : []));
};

export const sameMove = (
  a: { readonly slot: number; readonly at: Position },
  b: { readonly slot: number; readonly at: Position },
): boolean => a.slot === b.slot && samePosition(a.at, b.at);
