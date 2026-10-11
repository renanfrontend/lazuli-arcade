import { describe, expect, it } from 'vitest';
import { chooseMove } from '../bot';
import { freeCells, openNeighbors, positionsWhere, topColorAt } from '../board';
import { createMatch, createMatchReducer, type MatchState } from '../match';
import { DEFAULT_RULES } from '../rules';
import { canPlace, legalMoves } from '../side';
import { at, boardOf, sideOf, tray } from './fixtures';

const reduce = createMatchReducer(DEFAULT_RULES);

const isSettled = (state: MatchState) =>
  [state.player.board, state.opponent.board].every((board) =>
    positionsWhere(board, (cell) => cell.kind === 'open' && cell.stack.length > 0).every((position) =>
      openNeighbors(board, position).every((next) => topColorAt(board, next) !== topColorAt(board, position)),
    ),
  );

describe('bot', () => {
  it('always returns a legal move while one exists', () => {
    const match = createMatch(DEFAULT_RULES, { level: 1, seed: 5 });
    for (const skill of [0, 0.5, 1]) {
      const { move } = chooseMove(match.opponent, DEFAULT_RULES, skill, 99);
      expect(move).not.toBeNull();
      if (move) expect(canPlace(match.opponent, move.slot, move.at)).toBe(true);
    }
  });

  it('takes the clearing move when playing at full skill', () => {
    const side = sideOf(boardOf(['_ _ _ _', '_ sssssssss _ _', '_ _ _ _']), tray('gg', 'ss', 'yy'));
    const { move } = chooseMove(side, DEFAULT_RULES, 1, 1);
    expect(move?.slot).toBe(1);
    expect(move && Math.abs(move.at.col - 1) + Math.abs(move.at.row - 1)).toBe(1);
  });

  it('returns no move on a full board', () => {
    const side = sideOf(boardOf(['gg yy']), tray('s', null, null));
    expect(chooseMove(side, DEFAULT_RULES, 1, 1).move).toBeNull();
  });
});

describe('match', () => {
  it('starts both sides from independent boards', () => {
    const match = createMatch(DEFAULT_RULES, { level: 1, seed: 31 });
    expect(match).toMatchObject({ status: 'playing', target: 370, level: 1, eventSeq: 1, endReason: null });
    expect(match.lastEvent).toEqual({ type: 'started', seq: 1 });
    expect(match.player.board).not.toEqual(match.opponent.board);
  });

  it('ignores illegal placements', () => {
    const match = createMatch(DEFAULT_RULES, { level: 1, seed: 31 });
    expect(reduce(match, { type: 'place', slot: 0, at: at(2, 2) })).toBe(match);
  });

  it('wins when the player reaches the target', () => {
    const match = createMatch(DEFAULT_RULES, { level: 1, seed: 8 });
    const nearlyThere = { ...match, player: sideOf(boardOf(['_ ssssssss _']), tray('ss', 'g', 'y'), 360) };
    const next = reduce(nearlyThere, { type: 'place', slot: 0, at: at(0, 0) });
    expect(next.status).toBe('won');
    expect(next.endReason).toBe('target');
    expect(next.lastEvent?.type).toBe('playerPlaced');
  });

  it('loses when the player runs out of room', () => {
    const match = createMatch(DEFAULT_RULES, { level: 1, seed: 8 });
    const cramped = { ...match, player: sideOf(boardOf(['gg yy _']), tray('rr', 'g', 'y'), 40) };
    const next = reduce(cramped, { type: 'place', slot: 0, at: at(2, 0) });
    expect(next).toMatchObject({ status: 'lost', endReason: 'board-full' });
  });

  it('lets the opponent play and lose by reaching the target first', () => {
    const match = createMatch(DEFAULT_RULES, { level: 1, seed: 8 });
    const afterTurn = reduce(match, { type: 'opponentTurn' });
    expect(afterTurn.opponent.moves).toBe(1);
    expect(afterTurn.lastEvent?.type).toBe('opponentPlaced');
    expect(afterTurn.player).toBe(match.player);

    const rival = { ...match, opponent: sideOf(boardOf(['_ ssssssss _']), tray('ss', null, null), 365) };
    expect(reduce(rival, { type: 'opponentTurn' })).toMatchObject({ status: 'lost', endReason: 'opponent-target' });
  });

  it('plays whole matches to a result while keeping both boards settled', () => {
    for (let seed = 1; seed <= 6; seed += 1) {
      let state = createMatch(DEFAULT_RULES, { level: 1 + (seed % 3), seed: seed * 101 });
      let rng = seed;
      for (let turn = 0; turn < 400 && state.status === 'playing'; turn += 1) {
        if (turn % 2 === 0) {
          const choice = chooseMove(state.player, DEFAULT_RULES, 0.8, rng);
          rng = choice.seed;
          expect(choice.move).not.toBeNull();
          if (!choice.move) break;
          state = reduce(state, { type: 'place', slot: choice.move.slot, at: choice.move.at });
        } else {
          state = reduce(state, { type: 'opponentTurn' });
        }
        expect(isSettled(state)).toBe(true);
        if (state.status === 'playing') {
          expect(freeCells(state.player.board).length).toBeGreaterThan(0);
          expect(legalMoves(state.player).length).toBeGreaterThan(0);
        }
      }
      expect(state.status).not.toBe('playing');
      expect(state.endReason).not.toBeNull();
    }
  });

  it('keeps the event sequence growing across matches', () => {
    const first = createMatch(DEFAULT_RULES, { level: 1, seed: 1 });
    const second = reduce(first, { type: 'newMatch', level: 2, seed: 2 });
    expect(second.eventSeq).toBe(first.eventSeq + 1);
    expect(second.level).toBe(2);
    expect(second.status).toBe('playing');
  });
});
