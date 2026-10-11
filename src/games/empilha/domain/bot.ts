import type { Position } from '@shared/domain/grid';
import { nextFloat, nextInt, type Seed } from '@shared/domain/rng';
import { freeCells, isFreeCell, openNeighbors, stackAt, topColorAt, withStack, type Board } from './board';
import type { BotProfile } from './characters';
import type { Hand } from './hand';
import { resolveFrom } from './resolve';
import type { Rules } from './rules';
import { topColor } from './stack';

export interface BotMove {
  readonly slot: number;
  readonly at: Position;
}

interface ScoredMove extends BotMove {
  readonly value: number;
}

const BALANCED: BotProfile['style'] = { points: 1, room: 1, potential: 1 };

/**
 * Heuristic value of a move: points first, then how much it consolidates colors,
 * how much room it leaves and how well the new top fits its neighbourhood.
 */
const evaluate = (board: Board, hand: Hand, move: BotMove, rules: Rules, style: BotProfile['style']): number => {
  const stack = hand.tray[move.slot];
  if (!stack || !isFreeCell(board, move.at)) return Number.NEGATIVE_INFINITY;

  const result = resolveFrom(withStack(board, move.at, stack.tiles), move.at, rules.settle);
  const room = freeCells(result.board).length;
  const landedTop = topColor(stackAt(result.board, move.at) ?? []);
  const neighbours = openNeighbors(result.board, move.at);
  // Colors buried in the landed stack that a neighbour shows on top: future merges.
  const buried = new Set(stackAt(result.board, move.at) ?? []);
  const potential = neighbours.filter((next) => {
    const color = topColorAt(result.board, next);
    return color !== null && color !== landedTop && buried.has(color);
  }).length;

  return (
    result.points * 12 * style.points +
    result.tilesMoved * 1.4 +
    room * 1.1 * style.room +
    potential * 0.6 * style.potential -
    (room === 0 ? 1000 : 0)
  );
};

/**
 * Picks a rival's move on the shared board. With probability `skill` it plays the best move
 * found; otherwise one of the next few, which keeps weaker rivals beatable but never silly.
 */
export const chooseMove = (
  board: Board,
  hand: Hand,
  rules: Rules,
  profile: Pick<BotProfile, 'skill'> & { readonly style?: BotProfile['style'] },
  seed: Seed,
): { readonly move: BotMove | null; readonly seed: Seed } => {
  const free = freeCells(board);
  const style = profile.style ?? BALANCED;
  const candidates: ScoredMove[] = hand.tray.flatMap((stack, slot) =>
    stack ? free.map((at) => ({ slot, at, value: evaluate(board, hand, { slot, at }, rules, style) })) : [],
  );
  if (candidates.length === 0) return { move: null, seed };

  candidates.sort((a, b) => b.value - a.value);
  const roll = nextFloat(seed);
  if (roll.value < profile.skill || candidates.length === 1) {
    const best = candidates[0];
    return { move: best ? { slot: best.slot, at: best.at } : null, seed: roll.seed };
  }
  const pick = nextInt(roll.seed, Math.min(5, candidates.length - 1));
  const chosen = candidates[pick.value + 1] ?? candidates[0];
  return { move: chosen ? { slot: chosen.slot, at: chosen.at } : null, seed: pick.seed };
};
