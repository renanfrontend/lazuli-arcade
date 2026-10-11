import { describe, expect, it } from 'vitest';
import { chooseMove } from '../bot';
import { createMatch, createMatchReducer } from '../match';
import { DEFAULT_RULES } from '../rules';
import { fromSnapshot, toSnapshot, type MatchSnapshot } from '../snapshot';

const reduce = createMatchReducer(DEFAULT_RULES);

const playedMatch = () => {
  let state = createMatch(DEFAULT_RULES, { level: 3, seed: 404 });
  for (let turn = 0; turn < 12; turn += 1) {
    const { move } = chooseMove(state.player, DEFAULT_RULES, 1, turn);
    if (move) state = reduce(state, { type: 'place', slot: move.slot, at: move.at });
    state = reduce(state, { type: 'opponentTurn' });
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
    const state = playedMatch();
    const restored = roundTrip(toSnapshot(state));
    if (!restored) throw new Error('restore failed');
    expect(reduce(restored, { type: 'opponentTurn' }).opponent).toEqual(reduce(state, { type: 'opponentTurn' }).opponent);
  });

  it('rejects anything malformed', () => {
    const good = toSnapshot(playedMatch());
    const broken: unknown[] = [
      null,
      { ...good, version: 2 },
      { ...good, level: 0 },
      { ...good, status: 'paused' },
      { ...good, status: 'won', endReason: null },
      { ...good, player: { ...good.player, board: good.player.board.slice(1) } },
      { ...good, player: { ...good.player, board: ['=s', ...good.player.board.slice(1).map(() => 'x')] } },
      { ...good, player: { ...good.player, board: good.player.board.map((cell) => (cell === 'x' ? cell : '=q')) } },
      { ...good, opponent: { ...good.opponent, tray: [null, null, null] } },
      { ...good, opponent: { ...good.opponent, tray: good.opponent.tray.slice(1) } },
      { ...good, opponent: { ...good.opponent, score: -1 } },
      { ...good, opponent: { ...good.opponent, seed: 2 ** 40 } },
    ];
    for (const raw of broken) expect(roundTrip(raw as MatchSnapshot | null)).toBeNull();
  });
});
