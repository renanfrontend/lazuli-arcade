import { describe, expect, it } from 'vitest';
import { createGame, createGameReducer, DEFAULT_CONFIG } from '../game';
import { validOrigins } from '../placement';
import { fromSnapshot, toSnapshot, type GameSnapshot } from '../snapshot';

const reduce = createGameReducer(DEFAULT_CONFIG);

const playedGame = () => {
  let state = createGame(DEFAULT_CONFIG, { seed: 314, coins: 12, best: 3000 });
  for (let i = 0; i < 5; i += 1) {
    const piece = state.tray.find((slot) => slot !== null);
    const origin = piece ? validOrigins(state.board, piece.shape).next().value : undefined;
    if (!piece || !origin) break;
    state = reduce(state, { type: 'place', pieceId: piece.id, origin });
  }
  return state;
};

const roundTrip = (snapshot: unknown) => fromSnapshot(JSON.parse(JSON.stringify(snapshot)), DEFAULT_CONFIG);

describe('snapshot', () => {
  it('round-trips a game through JSON', () => {
    const state = playedGame();
    const restored = roundTrip(toSnapshot(state));
    expect(restored).toEqual({ ...state, lastEvent: null });
  });

  it('continues deterministically after a restore', () => {
    const state = playedGame();
    const restored = roundTrip(toSnapshot(state));
    if (!restored) throw new Error('restore failed');
    const piece = state.tray.find((slot) => slot !== null);
    const origin = piece ? validOrigins(state.board, piece.shape).next().value : undefined;
    if (!piece || !origin) throw new Error('fixture needs a move');
    const action = { type: 'place', pieceId: piece.id, origin } as const;
    expect(reduce(restored, action).tray).toEqual(reduce(state, action).tray);
  });

  const tamper = (patch: Partial<Record<keyof GameSnapshot, unknown>>) => ({ ...toSnapshot(playedGame()), ...patch });

  it.each<[string, Partial<Record<keyof GameSnapshot, unknown>>]>([
    ['unknown version', { version: 2 }],
    ['different board size', { cols: 8 }],
    ['bad board character', { board: 'x'.repeat(DEFAULT_CONFIG.cols * DEFAULT_CONFIG.rows) }],
    ['short board', { board: '...' }],
    ['completed row', { board: 's'.repeat(DEFAULT_CONFIG.cols) + '.'.repeat(DEFAULT_CONFIG.cols * (DEFAULT_CONFIG.rows - 1)) }],
    ['unknown shape', { tray: [{ id: 1, shape: 'hexagon', gem: 'sapphire' }, null, null] }],
    ['empty tray', { tray: [null, null, null] }],
    ['negative score', { score: -10 }],
    ['fractional coins', { coins: 1.5 }],
    ['oversized seed', { seed: 2 ** 33 }],
  ])('rejects %s', (_, patch) => {
    expect(roundTrip(tamper(patch))).toBeNull();
  });

  it('rejects non-objects', () => {
    expect(fromSnapshot(null, DEFAULT_CONFIG)).toBeNull();
    expect(fromSnapshot('save', DEFAULT_CONFIG)).toBeNull();
    expect(fromSnapshot([], DEFAULT_CONFIG)).toBeNull();
  });
});
