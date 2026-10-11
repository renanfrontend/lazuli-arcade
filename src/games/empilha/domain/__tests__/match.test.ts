import { describe, expect, it } from 'vitest';
import { freeCells, openNeighbors, positionsWhere, topColorAt } from '../board';
import { chooseMove } from '../bot';
import { findRival, RIVALS } from '../characters';
import { createMatch, createMatchReducer, type MatchState } from '../match';
import { DEFAULT_RULES } from '../rules';
import { canPlace } from '../hand';
import { at, boardOf, handOf, matchOf, tray } from './fixtures';

const reduce = createMatchReducer(DEFAULT_RULES);

const isSettled = (state: MatchState) =>
  positionsWhere(state.board, (cell) => cell.kind === 'open' && cell.stack.length > 0).every((position) =>
    openNeighbors(state.board, position).every((next) => topColorAt(state.board, next) !== topColorAt(state.board, position)),
  );

describe('bot', () => {
  it('always returns a legal move while one exists', () => {
    const match = createMatch(DEFAULT_RULES, { opponentId: 'tata', seed: 5 });
    for (const skill of [0, 0.5, 1]) {
      const { move } = chooseMove(match.board, match.opponent, DEFAULT_RULES, { skill }, 99);
      expect(move).not.toBeNull();
      if (move) expect(canPlace(match.board, match.opponent, move.slot, move.at)).toBe(true);
    }
  });

  it('takes the clearing move when playing at full skill', () => {
    const board = boardOf(['_ _ _ _', '_ sssssssss _ _', '_ _ _ _']);
    const { move } = chooseMove(board, handOf(tray('gg', 'ss', 'yy')), DEFAULT_RULES, { skill: 1 }, 1);
    expect(move?.slot).toBe(1);
    expect(move && Math.abs(move.at.col - 1) + Math.abs(move.at.row - 1)).toBe(1);
  });

  it('returns no move on a full board', () => {
    expect(chooseMove(boardOf(['gg yy']), handOf(tray('s', null, null)), DEFAULT_RULES, { skill: 1 }, 1).move).toBeNull();
  });
});

describe('match', () => {
  it('starts with one shared board and the player to move', () => {
    const match = createMatch(DEFAULT_RULES, { opponentId: 'lobo', seed: 31 });
    expect(match).toMatchObject({ status: 'playing', target: 250, level: findRival('lobo').tier, eventSeq: 1, turn: 'player' });
    expect(match.lastEvent).toEqual({ type: 'started', seq: 1 });
    expect(match.player.tray).not.toEqual(match.opponent.tray);
  });

  it('ignores illegal placements and moves out of turn', () => {
    const match = createMatch(DEFAULT_RULES, { opponentId: 'tata', seed: 31 });
    expect(reduce(match, { type: 'place', slot: 0, at: at(2, 2) })).toBe(match);
    expect(reduce(match, { type: 'opponentTurn' })).toBe(match);
  });

  it('keeps the turn until the whole tray is used, then hands over', () => {
    let state = createMatch(DEFAULT_RULES, { opponentId: 'tata', seed: 12 });
    for (let slot = 0; slot < 3; slot += 1) {
      expect(state.turn).toBe('player');
      const cell = freeCells(state.board)[0];
      if (!cell) throw new Error('fixture needs room');
      state = reduce(state, { type: 'place', slot, at: cell });
      expect(state.lastEvent).toMatchObject({ type: 'placed', by: 'player', handoff: slot === 2 });
    }
    expect(state.turn).toBe('opponent');
    expect(state.player.tray.every((entry) => entry !== null)).toBe(true);
    const replied = reduce(state, { type: 'opponentTurn' });
    expect(replied.lastEvent).toMatchObject({ type: 'placed', by: 'opponent' });
    expect(replied.opponent.moves).toBe(1);
  });

  it('wins when the player reaches the target', () => {
    const state = matchOf(boardOf(['_ ssssssss _']), handOf(tray('ss', 'g', 'y'), 245));
    expect(reduce(state, { type: 'place', slot: 0, at: at(0, 0) })).toMatchObject({ status: 'won', endReason: 'target' });
  });

  it('loses when the rival reaches the target', () => {
    const state = { ...matchOf(boardOf(['_ ssssssss _']), handOf(tray('g', 'y', 'r')), handOf(tray('ss', null, null), 245)), turn: 'opponent' as const };
    expect(reduce(state, { type: 'opponentTurn' })).toMatchObject({ status: 'lost', endReason: 'opponent-target' });
  });

  it('ends on points when the board fills up, and a tie goes against whoever was about to move', () => {
    const ahead = matchOf(boardOf(['gg yy _']), handOf(tray('rr', 'g', 'y'), 60), handOf(tray('s', 'g', 'y'), 40));
    expect(reduce(ahead, { type: 'place', slot: 0, at: at(2, 0) })).toMatchObject({ status: 'won', endReason: 'lead' });

    const behind = matchOf(boardOf(['gg yy _']), handOf(tray('rr', 'g', 'y'), 20), handOf(tray('s', 'g', 'y'), 40));
    expect(reduce(behind, { type: 'place', slot: 0, at: at(2, 0) })).toMatchObject({ status: 'lost', endReason: 'opponent-lead' });

    // Tray stays non-empty after the move, so the player would move again on the full board and loses the tie.
    const tied = matchOf(boardOf(['gg yy _']), handOf(tray('rr', 'g', 'y'), 40), handOf(tray('s', 'g', 'y'), 40));
    expect(reduce(tied, { type: 'place', slot: 0, at: at(2, 0) })).toMatchObject({ status: 'lost' });
  });

  it('plays whole matches against every rival to a result, keeping the board settled', () => {
    RIVALS.forEach((rival, index) => {
      let state = createMatch(DEFAULT_RULES, { opponentId: rival.id, seed: 101 * (index + 1) });
      let rng = index + 1;
      for (let guard = 0; guard < 600 && state.status === 'playing'; guard += 1) {
        if (state.turn === 'player') {
          const choice = chooseMove(state.board, state.player, DEFAULT_RULES, { skill: 0.8 }, rng);
          rng = choice.seed;
          expect(choice.move).not.toBeNull();
          if (!choice.move) break;
          state = reduce(state, { type: 'place', slot: choice.move.slot, at: choice.move.at });
        } else {
          state = reduce(state, { type: 'opponentTurn' });
        }
        expect(isSettled(state)).toBe(true);
      }
      expect(state.status).not.toBe('playing');
      expect(state.endReason).not.toBeNull();
    });
  });

  it('keeps the event sequence growing across matches', () => {
    const first = createMatch(DEFAULT_RULES, { opponentId: 'tata', seed: 1 });
    const second = reduce(first, { type: 'newMatch', opponentId: 'coruja', seed: 2 });
    expect(second.eventSeq).toBe(first.eventSeq + 1);
    expect(second).toMatchObject({ opponentId: 'coruja', status: 'playing', level: 8 });
  });
});
