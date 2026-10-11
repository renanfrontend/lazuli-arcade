import type { Position } from '@shared/domain/grid';
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
import { topColor, type Stack } from './stack';

/** What one player holds: a tray of stacks, a score and a private stream of luck. The board is shared. */
export interface Hand {
  readonly tray: readonly TraySlot[];
  readonly score: number;
  readonly moves: number;
  readonly seed: Seed;
  readonly nextId: number;
}

export interface PlacementOutcome {
  readonly hand: Hand;
  /** The shared board once everything has settled. */
  readonly board: Board;
  /** The stack that left the tray. */
  readonly stack: Stack;
  /** The board the moment the stack lands, before anything merges. */
  readonly landed: Board;
  readonly resolution: Resolution;
  readonly unlocked: readonly Position[];
  /** The tray was emptied and refilled: the turn passes to the other player. */
  readonly dealt: boolean;
}

/** Seeds a few stacks so the first moves already have neighbours to merge with. */
export const seedBoard = (seed: Seed, rules: Rules, level: number): { board: Board; seed: Seed } => {
  let current = seed;
  let board = boardFromLayout(rules.layout);
  const palette = rules.palette(level);
  for (let placed = 0, attempts = 0; placed < rules.initialStacks && attempts < 60; attempts += 1) {
    const free = freeCells(board);
    if (free.length === 0) break;
    const spot = nextInt(current, free.length);
    current = spot.seed;
    const position = free[spot.value];
    const stack = randomStack(current, rules.recipe, palette);
    current = stack.seed;
    const top = topColor(stack.value);
    // Keep the starting board settled: no neighbours with the same top color.
    if (!position || openNeighbors(board, position).some((next) => topColorAt(board, next) === top)) continue;
    board = withStack(board, position, stack.value);
    placed += 1;
  }
  return { board, seed: current };
};

export const createHand = (seed: Seed, board: Board, rules: Rules, level: number): Hand => {
  const deal = dealTray(seed, { board, recipe: rules.recipe, palette: rules.palette(level), size: rules.traySize, nextId: 1 });
  return { tray: deal.tray, score: 0, moves: 0, seed: deal.seed, nextId: deal.nextId };
};

export const canPlace = (board: Board, hand: Hand, slot: number, at: Position): boolean =>
  hand.tray[slot] != null && isFreeCell(board, at);

/**
 * Drops a tray stack on a free cell and settles everything that follows. `otherScore` is the
 * rival's score: locked cells open on the points of both players together. Returns null for illegal moves.
 */
export const applyPlacement = (
  board: Board,
  hand: Hand,
  slot: number,
  at: Position,
  otherScore: number,
  rules: Rules,
  level: number,
): PlacementOutcome | null => {
  const stack = hand.tray[slot];
  if (!stack || !isFreeCell(board, at)) return null;

  const landed = withStack(board, at, stack.tiles);
  const resolution = resolveFrom(landed, at, rules.settle);
  const score = hand.score + resolution.points;
  const { board: settled, unlocked } = unlockReached(resolution.board, score + otherScore);

  let tray: readonly TraySlot[] = hand.tray.map((entry, index) => (index === slot ? null : entry));
  let { seed, nextId } = hand;
  const dealt = tray.every((entry) => entry === null);
  if (dealt) {
    const deal = dealTray(seed, { board: settled, recipe: rules.recipe, palette: rules.palette(level), size: rules.traySize, nextId });
    ({ tray, seed, nextId } = deal);
  }

  return {
    hand: { tray, score, moves: hand.moves + 1, seed, nextId },
    board: settled,
    stack: stack.tiles,
    landed,
    resolution,
    unlocked,
    dealt,
  };
};

export interface Move {
  readonly slot: number;
  readonly at: Position;
}

/** Every legal (slot, cell) pair, slots in tray order and cells in reading order. */
export const legalMoves = (board: Board, hand: Hand): Move[] => {
  const free = freeCells(board);
  return hand.tray.flatMap((entry, slot) => (entry ? free.map((at) => ({ slot, at })) : []));
};
