import { describe, expect, it } from 'vitest';
import { chooseMove } from '../bot';
import { createMatch, createMatchReducer } from '../match';
import { DEFAULT_RULES } from '../rules';
import { fromSnapshot, toSnapshot, type MatchSnapshot } from '../snapshot';

const reduce = createMatchReducer(DEFAULT_RULES);

const playedMatch = () => {
  let state = createMatch(DEFAULT_RULES, { opponentId: 'elefantinho', seed: 404 });
  for (let step = 0; step < 14 && state.status === 'playing'; step += 1) {
    if (state.turn === 'player') {
      const { move } = chooseMove(state.board, state.player, DEFAULT_RULES, { skill: 1 }, step);
      if (move) state = reduce(state, { type: 'place', slot: move.slot, at: move.at });
    } else {
      state = reduce(state, { type: 'opponentTurn' });
    }
  }
  return state;
};

const roundTrip = (snapshot: unknown) => fromSnapshot(JSON.parse(JSON.stringify(snapshot)), DEFAULT_RULES);

describe('match snapshot', () => {
  it('round-trips a match through JSON', () => {
    const state = playedMatch();
    expect(roundTrip(toSnapshot(state))).toEqual({ ...state, lastEvent: null });
  });

  it('continues deterministically after a restore', () => {
    let state = playedMatch();
    // Make sure it is the rival's turn so the restored match can answer.
    while (state.status === 'playing' && state.turn === 'player') {
      const { move } = chooseMove(state.board, state.player, DEFAULT_RULES, { skill: 1 }, 5);
      if (!move) break;
      state = reduce(state, { type: 'place', slot: move.slot, at: move.at });
    }
    const restored = roundTrip(toSnapshot(state));
    if (!restored) throw new Error('restore failed');
    expect(reduce(restored, { type: 'opponentTurn' }).opponent).toEqual(reduce(state, { type: 'opponentTurn' }).opponent);
  });

  it('rejects anything malformed', () => {
    const good = toSnapshot(playedMatch());
    const broken: unknown[] = [
      null,
      { ...good, version: 1 },
      { ...good, level: 0 },
      { ...good, opponentId: 'dragao' },
      { ...good, turn: 'nobody' },
      { ...good, status: 'paused' },
      { ...good, status: 'won', endReason: null },
      { ...good, board: good.board.slice(1) },
      { ...good, board: ['=s', ...good.board.slice(1).map(() => 'x')] },
      { ...good, board: good.board.map((cell) => (cell === 'x' ? cell : '=q')) },
      { ...good, opponent: { ...good.opponent, tray: [null, null, null] } },
      { ...good, opponent: { ...good.opponent, tray: good.opponent.tray.slice(1) } },
      { ...good, opponent: { ...good.opponent, score: -1 } },
      { ...good, opponent: { ...good.opponent, seed: 2 ** 40 } },
    ];
    for (const raw of broken) expect(roundTrip(raw as MatchSnapshot | null)).toBeNull();
  });
});
