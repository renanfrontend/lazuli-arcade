import { samePosition, toIndex, type Position } from '@shared/domain/grid';
import { openNeighbors, stackAt, topColorAt, withStack, type Board } from './board';
import { splitTopRun, topRunLength } from './stack';
import type { SettleRules } from './rules';
import type { TileColor } from './tiles';

/** A run of tiles hopping onto the neighbouring stack with the same top color. */
export interface MergeStep {
  readonly type: 'merge';
  readonly from: Position;
  readonly to: Position;
  readonly color: TileColor;
  readonly count: number;
  readonly points: number;
  /** Board right after this step, for step-by-step animation. */
  readonly board: Board;
}

/** A run that reached the threshold and left the board, turning into points. */
export interface ClearStep {
  readonly type: 'clear';
  readonly at: Position;
  readonly color: TileColor;
  readonly count: number;
  /** 1 for the first clear of a move, 2 for the second… multiplies the points. */
  readonly chain: number;
  readonly points: number;
  readonly board: Board;
}

export type ResolveStep = MergeStep | ClearStep;

export interface Resolution {
  readonly board: Board;
  readonly steps: readonly ResolveStep[];
  readonly points: number;
  readonly tilesMoved: number;
  readonly tilesCleared: number;
  readonly clears: number;
}

const MAX_ITERATIONS = 1000;

/** Connected open cells (by shared edges) whose top tile has `color`, in BFS order from `start`. */
const sameTopGroup = (board: Board, start: Position, color: TileColor): Position[] => {
  const seen = new Set<number>([toIndex(board, start)]);
  const group: Position[] = [start];
  // Iterating while pushing is intended: array iterators also visit appended entries (a BFS queue).
  for (const current of group) {
    for (const next of openNeighbors(board, current)) {
      const index = toIndex(board, next);
      if (seen.has(index) || topColorAt(board, next) !== color) continue;
      seen.add(index);
      group.push(next);
    }
  }
  return group;
};

/** Tiles flow into the stack with the longest run of the color; ties favour the stack just placed. */
const pickReceiver = (board: Board, group: readonly Position[], origin: Position): Position => {
  let best = group[0] ?? origin;
  let bestScore = Number.NEGATIVE_INFINITY;
  group.forEach((position, order) => {
    const run = topRunLength(stackAt(board, position) ?? []);
    const score = run * 1000 + (samePosition(position, origin) ? 500 : 0) - order;
    if (score > bestScore) {
      best = position;
      bestScore = score;
    }
  });
  return best;
};

/** BFS tree over the group rooted at the receiver: each node knows its neighbour one step closer. */
const flowTree = (
  board: Board,
  group: readonly Position[],
  receiver: Position,
): { readonly order: Position[]; readonly parent: Map<number, Position> } => {
  const members = new Set(group.map((position) => toIndex(board, position)));
  const parent = new Map<number, Position>();
  const order: Position[] = [receiver];
  const seen = new Set<number>([toIndex(board, receiver)]);
  for (const current of order) {
    for (const next of openNeighbors(board, current)) {
      const index = toIndex(board, next);
      if (!members.has(index) || seen.has(index)) continue;
      seen.add(index);
      parent.set(index, current);
      order.push(next);
    }
  }
  return { order, parent };
};

const moveTopRun = (board: Board, from: Position, to: Position): { readonly board: Board; readonly count: number } => {
  const source = stackAt(board, from) ?? [];
  const target = stackAt(board, to) ?? [];
  const { rest, run } = splitTopRun(source);
  return { board: withStack(withStack(board, from, rest), to, [...target, ...run]), count: run.length };
};

/**
 * Settles the board after a stack lands on `origin`.
 *
 * 1. Stacks connected to the changed cell whose top color matches it flow, hop by hop along
 *    shared edges, into the one holding the longest run of that color (`mergePoints` per tile).
 * 2. A top run reaching `clearAt` tiles leaves the board and scores `count × chain`.
 * 3. Every stack whose top changed is checked again, so merges and clears can cascade.
 *
 * Each merge joins two runs into one and each clear removes a run, so the loop always ends.
 * Invariant kept: afterwards no two neighbouring stacks share a top color.
 */
export const resolveFrom = (initial: Board, origin: Position, { clearAt, mergePoints }: SettleRules): Resolution => {
  let board = initial;
  const steps: ResolveStep[] = [];
  const queue: Position[] = [origin];
  let points = 0;
  let chain = 0;
  let tilesMoved = 0;
  let tilesCleared = 0;

  for (let iteration = 0; queue.length > 0 && iteration < MAX_ITERATIONS; iteration += 1) {
    const current = queue.shift();
    if (!current) break;
    const color = topColorAt(board, current);
    if (!color) continue;

    const group = sameTopGroup(board, current, color);
    let receiver = current;

    if (group.length > 1) {
      receiver = pickReceiver(board, group, current);
      const { order, parent } = flowTree(board, group, receiver);
      // Farthest first, so tiles travel hop by hop and arrive together at the receiver.
      for (const node of order.slice(1).reverse()) {
        const next = parent.get(toIndex(board, node));
        if (!next) continue;
        const moved = moveTopRun(board, node, next);
        board = moved.board;
        tilesMoved += moved.count;
        const earned = moved.count * mergePoints;
        points += earned;
        steps.push({ type: 'merge', from: node, to: next, color, count: moved.count, points: earned, board });
        if ((stackAt(board, node)?.length ?? 0) > 0) queue.push(node);
      }
    }

    const run = topRunLength(stackAt(board, receiver) ?? []);
    if (run >= clearAt) {
      chain += 1;
      const stack = stackAt(board, receiver) ?? [];
      board = withStack(board, receiver, splitTopRun(stack).rest);
      const gained = run * chain;
      points += gained;
      tilesCleared += run;
      steps.push({ type: 'clear', at: receiver, color, count: run, chain, points: gained, board });
      if ((stackAt(board, receiver)?.length ?? 0) > 0) queue.push(receiver);
    }
  }

  return { board, steps, points, tilesMoved, tilesCleared, clears: chain };
};
