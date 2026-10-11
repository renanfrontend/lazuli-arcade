import { describe, expect, it } from 'vitest';
import { isBoardEmpty, type Board } from '../board';
import { anyPieceFits, type TrayPiece } from '../dealer';
import {
  createGame,
  createGameReducer,
  DEFAULT_CONFIG,
  rerollPrice,
  type GameConfig,
  type GameState,
} from '../game';
import { findCompletedLines, lineTotal } from '../lines';
import { validOrigins } from '../placement';
import { nextInt, type Seed } from '../rng';
import { boardFrom, shape, shapeLike } from './fixtures';

const openConfig: GameConfig = { ...DEFAULT_CONFIG, rubble: null };
const reduce = createGameReducer(DEFAULT_CONFIG);

const withBoard = (state: GameState, board: Board, tray: readonly (TrayPiece | null)[]): GameState => ({
  ...state,
  board,
  tray,
  status: 'playing',
});

describe('createGame', () => {
  it('starts a playable game with rubble and a full tray', () => {
    const state = createGame(DEFAULT_CONFIG, { seed: 123, best: 900, coins: 45 });
    expect(state.status).toBe('playing');
    expect(state.tray).toHaveLength(3);
    expect(state.tray.every((piece) => piece !== null)).toBe(true);
    expect(isBoardEmpty(state.board)).toBe(false);
    expect(lineTotal(findCompletedLines(state.board))).toBe(0);
    expect(state).toMatchObject({ score: 0, best: 900, coins: 45, runCoins: 0, lastEvent: { type: 'started' } });
  });

  it('starts empty when rubble is disabled', () => {
    expect(isBoardEmpty(createGame(openConfig, { seed: 1 }).board)).toBe(true);
  });
});

describe('gameReducer', () => {
  const start = createGame(DEFAULT_CONFIG, { seed: 7 });

  it('ignores invalid placements without creating a new state', () => {
    const piece = start.tray[0];
    if (!piece) throw new Error('fixture needs a piece');
    expect(reduce(start, { type: 'place', pieceId: piece.id, origin: { col: -5, row: 0 } })).toBe(start);
    expect(reduce(start, { type: 'place', pieceId: 9999, origin: { col: 0, row: 0 } })).toBe(start);
  });

  it('places a piece, clears the completed row and pays one coin per gem', () => {
    const board = boardFrom(`
      ...........
      ...........
      ###.#######
    `);
    const dot: TrayPiece = { id: 1, shape: shape('dot'), gem: 'sapphire' };
    const spare: TrayPiece = { id: 2, shape: shapeLike('###'), gem: 'sapphire' };
    const state = withBoard({ ...start, coins: 10 }, board, [dot, spare, null]);

    const next = createGameReducer({ ...DEFAULT_CONFIG, rows: 3 })(state, {
      type: 'place',
      pieceId: 1,
      origin: { col: 3, row: 2 },
    });

    expect(isBoardEmpty(next.board)).toBe(true);
    expect(next.tray).toEqual([null, spare, null]);
    expect(next.coins).toBe(10 + 11 + DEFAULT_CONFIG.scoring.perfectClearCoins);
    expect(next.streak).toBe(1);
    expect(next.lastEvent).toMatchObject({
      type: 'placed',
      lines: { rows: [2], cols: [] },
      perfectClear: true,
      dealt: false,
      gameOver: false,
    });
    if (next.lastEvent?.type !== 'placed') throw new Error('expected a placed event');
    expect(next.lastEvent.cleared).toHaveLength(11);
  });

  it('deals a new tray once the last piece is used', () => {
    const dot: TrayPiece = { id: 1, shape: shape('dot'), gem: 'sapphire' };
    const state = withBoard(start, start.board, [dot, null, null]);
    const origin = validOrigins(state.board, dot.shape).next().value;
    if (!origin) throw new Error('fixture needs room');
    const next = reduce(state, { type: 'place', pieceId: 1, origin });
    expect(next.tray.every((piece) => piece !== null)).toBe(true);
    expect(next.lastEvent).toMatchObject({ type: 'placed', dealt: true });
  });

  it('ends the game when no remaining piece fits', () => {
    // Checkerboard: single cells fit, a 2x2 square never does.
    const board = boardFrom(`
      #.#.
      .#.#
      #.#.
    `);
    const dot: TrayPiece = { id: 1, shape: shape('dot'), gem: 'sapphire' };
    const square: TrayPiece = { id: 2, shape: shape('square2'), gem: 'sapphire' };
    const config: GameConfig = { ...DEFAULT_CONFIG, cols: 4, rows: 3 };
    const state = withBoard(start, board, [dot, square, null]);
    const next = createGameReducer(config)(state, { type: 'place', pieceId: 1, origin: { col: 1, row: 0 } });
    expect(next.status).toBe('over');
    expect(next.lastEvent).toMatchObject({ type: 'placed', gameOver: true });
    expect(createGameReducer(config)(next, { type: 'place', pieceId: 2, origin: { col: 0, row: 0 } })).toBe(next);
  });

  it('charges coins to reroll and refuses when the wallet is short', () => {
    const poor = { ...start, coins: DEFAULT_CONFIG.rerollCost - 1 };
    expect(reduce(poor, { type: 'reroll' })).toBe(poor);

    const rich = { ...start, coins: 100 };
    const next = reduce(rich, { type: 'reroll' });
    expect(next.coins).toBe(100 - DEFAULT_CONFIG.rerollCost);
    expect(next.tray.map((piece) => piece?.id)).not.toEqual(rich.tray.map((piece) => piece?.id));
    expect(next.lastEvent).toMatchObject({ type: 'rerolled', cost: DEFAULT_CONFIG.rerollCost });
  });

  it('raises the price of every further reroll in the same game', () => {
    const first = reduce({ ...start, coins: 200 }, { type: 'reroll' });
    const second = reduce(first, { type: 'reroll' });
    expect(200 - first.coins).toBe(DEFAULT_CONFIG.rerollCost);
    expect(first.coins - second.coins).toBe(DEFAULT_CONFIG.rerollCost * 2);
    expect(rerollPrice(DEFAULT_CONFIG, second)).toBe(DEFAULT_CONFIG.rerollCost * 3);
    expect(reduce(second, { type: 'restart', seed: 5 }).rerolls).toBe(0);
  });

  it('revives a finished game through a reroll', () => {
    const over: GameState = { ...start, status: 'over', coins: 60 };
    const next = reduce(over, { type: 'reroll' });
    expect(next.status).toBe('playing');
    expect(anyPieceFits(next.board, next.tray)).toBe(true);
  });

  it('restarts keeping the wallet and best score', () => {
    const played = { ...start, score: 1500, best: 1500, coins: 77, eventSeq: 10 };
    const next = reduce(played, { type: 'restart', seed: 99 });
    expect(next).toMatchObject({ score: 0, best: 1500, coins: 77, runCoins: 0, moves: 0, eventSeq: 11 });
  });
});

describe('simulated games', () => {
  /** Plays random legal moves and checks the invariants after every step. */
  const play = (seed: Seed, maxMoves: number): GameState => {
    let state = createGame(DEFAULT_CONFIG, { seed });
    let rng = seed ^ 0x5bd1e995;
    for (let move = 0; move < maxMoves && state.status === 'playing'; move += 1) {
      const options = state.tray.flatMap((piece) =>
        piece ? [...validOrigins(state.board, piece.shape)].map((origin) => ({ piece, origin })) : [],
      );
      expect(options.length).toBeGreaterThan(0);
      const pick = nextInt(rng, options.length);
      rng = pick.seed;
      const choice = options[pick.value];
      if (!choice) throw new Error('unreachable');

      const before = state;
      state = reduce(state, { type: 'place', pieceId: choice.piece.id, origin: choice.origin });

      expect(state).not.toBe(before);
      expect(lineTotal(findCompletedLines(state.board))).toBe(0);
      expect(state.tray.some((piece) => piece !== null)).toBe(true);
      expect(state.score).toBeGreaterThan(before.score);
      expect(state.coins).toBeGreaterThanOrEqual(before.coins);
      expect(state.status === 'playing').toBe(anyPieceFits(state.board, state.tray));
    }
    return state;
  };

  it('keeps every invariant across many random games', () => {
    for (let seed = 1; seed <= 12; seed += 1) {
      const final = play(seed * 7919, 400);
      expect(final.moves).toBeGreaterThan(0);
    }
  });

  it('replays identically from the same seed', () => {
    expect(play(4242, 60)).toEqual(play(4242, 60));
  });
});
