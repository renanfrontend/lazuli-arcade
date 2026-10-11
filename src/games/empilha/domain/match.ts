import type { CastId } from '@shared/cast/cast';
import type { Position } from '@shared/domain/grid';
import { nextInt, toSeed, type Seed } from '@shared/domain/rng';
import { freeCells, type Board } from './board';
import { chooseMove } from './bot';
import { findRival } from './characters';
import { applyPlacement, createHand, seedBoard, type Hand, type Move, type PlacementOutcome } from './hand';
import type { Rules } from './rules';
import type { Resolution } from './resolve';
import type { Stack } from './stack';

export type MatchStatus = 'playing' | 'won' | 'lost';

/** `target`: someone reached the goal. `lead`: the board filled up and the higher score takes the match. */
export type EndReason = 'target' | 'opponent-target' | 'lead' | 'opponent-lead';

export type Turn = 'player' | 'opponent';

export interface StartedEvent {
  readonly type: 'started';
  readonly seq: number;
}

/** One stack placed by either side: everything the screen needs to replay it. */
export interface PlacedEvent {
  readonly type: 'placed';
  readonly seq: number;
  readonly by: Turn;
  readonly slot: number;
  readonly at: Position;
  /** The stack that left the tray. */
  readonly stack: Stack;
  /** The board the moment the stack lands, before anything merges. */
  readonly landed: Board;
  readonly resolution: Resolution;
  readonly unlocked: readonly Position[];
  /** The mover's tray was refilled: the turn passes. */
  readonly handoff: boolean;
}

export type MatchEvent = StartedEvent | PlacedEvent;

export interface MatchState {
  readonly opponentId: CastId;
  /** Difficulty tier of the rival, which also widens the tile palette. */
  readonly level: number;
  readonly target: number;
  readonly status: MatchStatus;
  readonly endReason: EndReason | null;
  /** One board for both players. */
  readonly board: Board;
  readonly turn: Turn;
  readonly player: Hand;
  readonly opponent: Hand;
  /** Monotonic across matches, so UI side effects can key on it. */
  readonly eventSeq: number;
  readonly lastEvent: MatchEvent | null;
}

export type MatchAction =
  | { readonly type: 'place'; readonly slot: number; readonly at: Position }
  | { readonly type: 'opponentTurn' }
  | { readonly type: 'newMatch'; readonly opponentId: CastId; readonly seed: Seed };

export interface NewMatchInput {
  readonly opponentId: CastId;
  readonly seed: Seed;
  readonly eventSeq?: number;
  /** Overrides the rival's tier (used when two rivals play each other). */
  readonly level?: number;
}

export const createMatch = (rules: Rules, { opponentId, seed, eventSeq = 0, level }: NewMatchInput): MatchState => {
  const safeLevel = Math.max(1, Math.floor(level ?? findRival(opponentId).tier));
  const seeded = seedBoard(toSeed(seed), rules, safeLevel);
  // Each hand draws from its own stream so neither can influence the other's luck.
  const playerSeed = nextInt(toSeed(seed ^ 0x51ed270b), 0xffffffff).value;
  const opponentSeed = nextInt(toSeed(seed ^ 0x9e3779b9), 0xffffffff).value;
  const seq = eventSeq + 1;
  return {
    opponentId,
    level: safeLevel,
    target: rules.target(safeLevel),
    status: 'playing',
    endReason: null,
    board: seeded.board,
    turn: 'player',
    player: createHand(playerSeed, seeded.board, rules, safeLevel),
    opponent: createHand(opponentSeed, seeded.board, rules, safeLevel),
    eventSeq: seq,
    lastEvent: { type: 'started', seq },
  };
};

const other = (turn: Turn): Turn => (turn === 'player' ? 'opponent' : 'player');

/** Applies one placement by `by` and works out whose turn it is and whether the match ended. */
export const applyMove = (rules: Rules, state: MatchState, by: Turn, slot: number, at: Position): MatchState => {
  if (state.status !== 'playing' || state.turn !== by) return state;
  const mine = state[by];
  const theirs = state[other(by)];
  const outcome: PlacementOutcome | null = applyPlacement(state.board, mine, slot, at, theirs.score, rules, state.level);
  if (!outcome) return state;

  const reachedTarget = outcome.hand.score >= state.target;
  const nextTurn = outcome.dealt ? other(by) : by;
  // A full board ends the match on points; a tie goes against whoever was about to move.
  const filled = !reachedTarget && freeCells(outcome.board).length === 0;
  const scores = { ...state, [by]: outcome.hand };
  const leader: Turn | null = !filled
    ? null
    : scores.player.score === scores.opponent.score
      ? other(nextTurn)
      : scores.player.score > scores.opponent.score
        ? 'player'
        : 'opponent';
  const winner: Turn | null = reachedTarget ? by : leader;
  const seq = state.eventSeq + 1;

  const endReason: EndReason | null =
    winner === null ? null : reachedTarget ? (by === 'player' ? 'target' : 'opponent-target') : winner === 'player' ? 'lead' : 'opponent-lead';

  return {
    ...state,
    board: outcome.board,
    turn: nextTurn,
    [by]: outcome.hand,
    status: winner === null ? 'playing' : winner === 'player' ? 'won' : 'lost',
    endReason,
    eventSeq: seq,
    lastEvent: {
      type: 'placed',
      seq,
      by,
      slot,
      at,
      stack: outcome.stack,
      landed: outcome.landed,
      resolution: outcome.resolution,
      unlocked: outcome.unlocked,
      handoff: outcome.dealt,
    },
  };
};

/** The rival picks and plays one stack. */
export const opponentTurn = (rules: Rules, state: MatchState): MatchState => {
  if (state.status !== 'playing' || state.turn !== 'opponent') return state;
  const profile = findRival(state.opponentId).bot;
  const choice = chooseMove(state.board, state.opponent, rules, profile, state.opponent.seed);
  const thinking: MatchState = { ...state, opponent: { ...state.opponent, seed: choice.seed } };
  // Unreachable while a free cell exists; kept so a corrupt save can never stall the match.
  if (!choice.move) return { ...thinking, status: 'won', endReason: 'lead' };
  return applyMove(rules, thinking, 'opponent', choice.move.slot, choice.move.at);
};

export const createMatchReducer =
  (rules: Rules) =>
  (state: MatchState, action: MatchAction): MatchState => {
    switch (action.type) {
      case 'place':
        return applyMove(rules, state, 'player', action.slot, action.at);
      case 'opponentTurn':
        return opponentTurn(rules, state);
      case 'newMatch':
        return createMatch(rules, { opponentId: action.opponentId, seed: action.seed, eventSeq: state.eventSeq });
    }
  };

export type { Move };
