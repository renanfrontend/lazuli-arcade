import { nextInt, type Seed } from '@shared/domain/rng';
import type { CastId } from '@shared/cast/cast';
import { chooseMove } from './bot';
import { findRival } from './characters';
import { applyMove, createMatch } from './match';
import type { Rules } from './rules';

export type DuelSide = 'first' | 'second';

export interface DuelResult {
  readonly winner: DuelSide;
  readonly firstScore: number;
  readonly secondScore: number;
}

/**
 * Plays two cast members against each other without a screen (other bracket matches of a
 * tournament). Deterministic for a given seed; `first` takes the player's seat.
 */
export const simulateDuel = (rules: Rules, first: CastId, second: CastId, seed: Seed): DuelResult => {
  const a = findRival(first);
  const b = findRival(second);
  let state = createMatch(rules, { opponentId: second, seed, level: Math.max(a.tier, b.tier) });
  let rng = nextInt(seed, 0xffffffff).seed;

  for (let guard = 0; guard < 600 && state.status === 'playing'; guard += 1) {
    const by = state.turn;
    const profile = by === 'player' ? a.bot : b.bot;
    const choice = chooseMove(state.board, state[by], rules, profile, rng);
    rng = choice.seed;
    if (!choice.move) {
      state = { ...state, status: by === 'player' ? 'lost' : 'won', endReason: by === 'player' ? 'opponent-lead' : 'lead' };
      break;
    }
    state = applyMove(rules, state, by, choice.move.slot, choice.move.at);
  }

  const firstScore = state.player.score;
  const secondScore = state.opponent.score;
  const winner: DuelSide = state.status === 'won' ? 'first' : state.status === 'lost' ? 'second' : firstScore >= secondScore ? 'first' : 'second';
  return { winner, firstScore, secondScore };
};
