import type { Position } from '@shared/domain/grid';
import { nextFloat, nextInt, type Seed } from '@shared/domain/rng';
import { freeCells, isFreeCell, openNeighbors, stackAt, topColorAt, withStack } from './board';
import { resolveFrom } from './resolve';
import type { Rules } from './rules';
import type { Side } from './side';
import { topColor } from './stack';

export interface BotMove {
  readonly slot: number;
  readonly at: Position;
}

interface ScoredMove extends BotMove {
  readonly value: number;
}

/**
 * Heuristic value of a move: points first, then how much it consolidates colors,
 * how much room it leaves and how well the new top fits its neighbourhood.
 */
const evaluate = (side: Side, move: BotMove, rules: Rules): number => {
  const stack = side.tray[move.slot];
  if (!stack || !isFreeCell(side.board, move.at)) return Number.NEGATIVE_INFINITY;

  const result = resolveFrom(withStack(side.board, move.at, stack.tiles), move.at, rules.settle);
  const room = freeCells(result.board).length;
  const landedTop = topColor(stackAt(result.board, move.at) ?? []);
  const neighbours = openNeighbors(result.board, move.at);
  // Colors buried in the landed stack that a neighbour shows on top: future merges.
  const buried = new Set(stackAt(result.board, move.at) ?? []);
  const potential = neighbours.filter((next) => {
    const color = topColorAt(result.board, next);
    return color !== null && color !== landedTop && buried.has(color);
  }).length;

  return result.points * 12 + result.tilesMoved * 1.4 + room * 1.1 + potential * 0.6 - (room === 0 ? 1000 : 0);
};

/**
 * Picks the opponent's move. With probability `skill` it plays the best move found;
 * otherwise one of the next few, which keeps weaker levels beatable but never silly.
 */
export const chooseMove = (
  side: Side,
  rules: Rules,
  skill: number,
  seed: Seed,
): { readonly move: BotMove | null; readonly seed: Seed } => {
  const free = freeCells(side.board);
  const candidates: ScoredMove[] = side.tray.flatMap((stack, slot) =>
    stack ? free.map((at) => ({ slot, at, value: evaluate(side, { slot, at }, rules) })) : [],
  );
  if (candidates.length === 0) return { move: null, seed };

  candidates.sort((a, b) => b.value - a.value);
  const roll = nextFloat(seed);
  if (roll.value < skill || candidates.length === 1) {
    const best = candidates[0];
    return { move: best ? { slot: best.slot, at: best.at } : null, seed: roll.seed };
  }
  const pick = nextInt(roll.seed, Math.min(5, candidates.length - 1));
  const chosen = candidates[pick.value + 1] ?? candidates[0];
  return { move: chosen ? { slot: chosen.slot, at: chosen.at } : null, seed: pick.seed };
};
