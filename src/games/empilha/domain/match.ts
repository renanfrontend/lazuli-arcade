import type { Position } from '@shared/domain/grid';
import { nextInt, toSeed, type Seed } from '@shared/domain/rng';
import { chooseMove } from './bot';
import type { Rules } from './rules';
import { applyPlacement, createSide, type PlacementOutcome, type Side } from './side';

export type MatchStatus = 'playing' | 'won' | 'lost';

export type EndReason = 'target' | 'opponent-target' | 'board-full' | 'opponent-board-full';

export interface StartedEvent {
  readonly type: 'started';
  readonly seq: number;
}

export interface PlayerPlacedEvent {
  readonly type: 'playerPlaced';
  readonly seq: number;
  readonly slot: number;
  readonly at: Position;
  readonly outcome: Omit<PlacementOutcome, 'side'>;
}

export interface OpponentPlacedEvent {
  readonly type: 'opponentPlaced';
  readonly seq: number;
  readonly slot: number;
  readonly at: Position;
  readonly points: number;
  readonly clears: number;
  readonly dealt: boolean;
}

export type MatchEvent = StartedEvent | PlayerPlacedEvent | OpponentPlacedEvent;

export interface MatchState {
  readonly level: number;
  readonly target: number;
  readonly status: MatchStatus;
  readonly endReason: EndReason | null;
  readonly player: Side;
  readonly opponent: Side;
  /** Monotonic across matches, so UI side effects can key on it. */
  readonly eventSeq: number;
  readonly lastEvent: MatchEvent | null;
}

export type MatchAction =
  | { readonly type: 'place'; readonly slot: number; readonly at: Position }
  | { readonly type: 'opponentTurn' }
  | { readonly type: 'newMatch'; readonly level: number; readonly seed: Seed };

export interface NewMatchInput {
  readonly level: number;
  readonly seed: Seed;
  readonly eventSeq?: number;
}

export const createMatch = (rules: Rules, { level, seed, eventSeq = 0 }: NewMatchInput): MatchState => {
  const safeLevel = Math.max(1, Math.floor(level));
  // Each side draws from its own stream so neither can influence the other's luck.
  const playerSeed = toSeed(seed);
  const opponentSeed = nextInt(toSeed(seed ^ 0x9e3779b9), 0xffffffff).value;
  const seq = eventSeq + 1;
  return {
    level: safeLevel,
    target: rules.target(safeLevel),
    status: 'playing',
    endReason: null,
    player: createSide(playerSeed, rules, safeLevel),
    opponent: createSide(opponentSeed, rules, safeLevel),
    eventSeq: seq,
    lastEvent: { type: 'started', seq },
  };
};

const playerPlace = (rules: Rules, state: MatchState, slot: number, at: Position): MatchState => {
  if (state.status !== 'playing') return state;
  const outcome = applyPlacement(state.player, slot, at, rules, state.level);
  if (!outcome) return state;

  const { side, ...details } = outcome;
  const reachedTarget = side.score >= state.target;
  const seq = state.eventSeq + 1;
  return {
    ...state,
    player: side,
    status: reachedTarget ? 'won' : outcome.stuck ? 'lost' : 'playing',
    endReason: reachedTarget ? 'target' : outcome.stuck ? 'board-full' : null,
    eventSeq: seq,
    lastEvent: { type: 'playerPlaced', seq, slot, at, outcome: details },
  };
};

const opponentTurn = (rules: Rules, state: MatchState): MatchState => {
  if (state.status !== 'playing') return state;
  const profile = rules.bot(state.level);
  const choice = chooseMove(state.opponent, rules, profile.skill, state.opponent.seed);
  const thinking: Side = { ...state.opponent, seed: choice.seed };
  const outcome = choice.move ? applyPlacement(thinking, choice.move.slot, choice.move.at, rules, state.level) : null;
  if (!choice.move || !outcome) {
    // No legal move: the opponent's board is full.
    return { ...state, opponent: thinking, status: 'won', endReason: 'opponent-board-full' };
  }

  const opponent = outcome.side;
  const reachedTarget = opponent.score >= state.target;
  const seq = state.eventSeq + 1;
  return {
    ...state,
    opponent,
    status: reachedTarget ? 'lost' : outcome.stuck ? 'won' : 'playing',
    endReason: reachedTarget ? 'opponent-target' : outcome.stuck ? 'opponent-board-full' : null,
    eventSeq: seq,
    lastEvent: {
      type: 'opponentPlaced',
      seq,
      slot: choice.move.slot,
      at: choice.move.at,
      points: outcome.resolution.points,
      clears: outcome.resolution.clears,
      dealt: outcome.dealt,
    },
  };
};

export const createMatchReducer =
  (rules: Rules) =>
  (state: MatchState, action: MatchAction): MatchState => {
    switch (action.type) {
      case 'place':
        return playerPlace(rules, state, action.slot, action.at);
      case 'opponentTurn':
        return opponentTurn(rules, state);
      case 'newMatch':
        return createMatch(rules, { level: action.level, seed: action.seed, eventSeq: state.eventSeq });
    }
  };
