import { createBoard, isBoardEmpty, type Board } from './board';
import { anyPieceFits, dealTray, type TraySlot } from './dealer';
import type { GemKind } from './gem';
import type { Position } from './grid';
import { clearLines, findCompletedLines, lineTotal, type ClearedCell, type LineSet } from './lines';
import { canPlace, footprint, placeShape } from './placement';
import { toSeed, type Seed } from './rng';
import { generateRubble, type RubbleOptions } from './rubble';
import { DEFAULT_SCORING, scoreMove, type ScoringRules } from './scoring';
import { difficultyLevel, SHAPE_CATALOG, type Shape } from './shapes';

export interface GameConfig {
  readonly cols: number;
  readonly rows: number;
  readonly traySize: number;
  readonly palette: readonly GemKind[];
  readonly catalog: readonly Shape[];
  readonly scoring: ScoringRules;
  /** Price of the first reroll in a game; each further reroll costs one more step. */
  readonly rerollCost: number;
  readonly rubble: RubbleOptions | null;
  /** Placements until the deal reaches full difficulty. */
  readonly difficultyRampMoves: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  cols: 11,
  rows: 13,
  traySize: 3,
  palette: ['sapphire'],
  catalog: SHAPE_CATALOG,
  scoring: DEFAULT_SCORING,
  rerollCost: 30,
  rubble: { rows: 6, bottomDensity: 0.84, topDensity: 0.42, wellBias: 0.45, minGapsPerRow: 2 },
  difficultyRampMoves: 300,
};

export type GameStatus = 'playing' | 'over';

export interface StartedEvent {
  readonly type: 'started';
  readonly seq: number;
}

export interface PlacedEvent {
  readonly type: 'placed';
  readonly seq: number;
  readonly pieceId: number;
  readonly gem: GemKind;
  readonly placed: readonly Position[];
  readonly lines: LineSet;
  readonly cleared: readonly ClearedCell[];
  readonly points: number;
  readonly coins: number;
  readonly streak: number;
  readonly perfectClear: boolean;
  readonly dealt: boolean;
  readonly gameOver: boolean;
}

export interface RerolledEvent {
  readonly type: 'rerolled';
  readonly seq: number;
  readonly cost: number;
  readonly gameOver: boolean;
}

export type GameEvent = StartedEvent | PlacedEvent | RerolledEvent;

export interface GameState {
  readonly status: GameStatus;
  readonly board: Board;
  readonly tray: readonly TraySlot[];
  readonly score: number;
  readonly best: number;
  /** Wallet: carried over between games. */
  readonly coins: number;
  /** Coins earned in the current game. */
  readonly runCoins: number;
  readonly streak: number;
  readonly movesSinceClear: number;
  readonly moves: number;
  /** Rerolls bought in the current game. */
  readonly rerolls: number;
  readonly seed: Seed;
  readonly nextPieceId: number;
  /** Monotonic across restarts, so UI side effects can key on it safely. */
  readonly eventSeq: number;
  readonly lastEvent: GameEvent | null;
}

export type GameAction =
  | { readonly type: 'place'; readonly pieceId: number; readonly origin: Position }
  | { readonly type: 'reroll' }
  | { readonly type: 'restart'; readonly seed: Seed };

export interface NewGameInput {
  readonly seed: Seed;
  readonly best?: number;
  readonly coins?: number;
  readonly eventSeq?: number;
}

export const createGame = (config: GameConfig, input: NewGameInput): GameState => {
  let seed = toSeed(input.seed);
  let board = createBoard(config.cols, config.rows);

  if (config.rubble) {
    const rubble = generateRubble(board, seed, config.rubble, config.palette);
    board = rubble.value;
    seed = rubble.seed;
  }

  const deal = dealTray(seed, {
    board,
    catalog: config.catalog,
    palette: config.palette,
    size: config.traySize,
    nextPieceId: 1,
  });
  const eventSeq = (input.eventSeq ?? 0) + 1;

  return {
    status: anyPieceFits(board, deal.tray) ? 'playing' : 'over',
    board,
    tray: deal.tray,
    score: 0,
    best: input.best ?? 0,
    coins: input.coins ?? 0,
    runCoins: 0,
    streak: 0,
    movesSinceClear: 0,
    moves: 0,
    rerolls: 0,
    seed: deal.seed,
    nextPieceId: deal.nextPieceId,
    eventSeq,
    lastEvent: { type: 'started', seq: eventSeq },
  };
};

const place = (config: GameConfig, state: GameState, pieceId: number, origin: Position): GameState => {
  if (state.status !== 'playing') return state;
  const piece = state.tray.find((slot) => slot?.id === pieceId);
  if (!piece || !canPlace(state.board, piece.shape, origin)) return state;

  const placedBoard = placeShape(state.board, piece.shape, origin, piece.gem);
  const lines = findCompletedLines(placedBoard);
  const { board, cleared } = clearLines(placedBoard, lines);
  const perfectClear = cleared.length > 0 && isBoardEmpty(board);
  const result = scoreMove(config.scoring, {
    placedCells: piece.shape.cells.length,
    clearedCells: cleared.length,
    lines: lineTotal(lines),
    streak: state.streak,
    movesSinceClear: state.movesSinceClear,
    perfectClear,
  });

  let tray: readonly TraySlot[] = state.tray.map((slot) => (slot?.id === pieceId ? null : slot));
  let { seed, nextPieceId } = state;
  const dealt = tray.every((slot) => slot === null);
  if (dealt) {
    const deal = dealTray(seed, {
      board,
      catalog: config.catalog,
      palette: config.palette,
      size: config.traySize,
      nextPieceId,
      level: difficultyLevel(state.moves + 1, config.difficultyRampMoves),
    });
    ({ tray, seed, nextPieceId } = deal);
  }

  const gameOver = !anyPieceFits(board, tray);
  const score = state.score + result.points;
  const eventSeq = state.eventSeq + 1;

  return {
    ...state,
    status: gameOver ? 'over' : 'playing',
    board,
    tray,
    score,
    best: Math.max(state.best, score),
    coins: state.coins + result.coins,
    runCoins: state.runCoins + result.coins,
    streak: result.streak,
    movesSinceClear: result.movesSinceClear,
    moves: state.moves + 1,
    seed,
    nextPieceId,
    eventSeq,
    lastEvent: {
      type: 'placed',
      seq: eventSeq,
      pieceId,
      gem: piece.gem,
      placed: footprint(piece.shape, origin),
      lines,
      cleared,
      points: result.points,
      coins: result.coins,
      streak: result.streak,
      perfectClear,
      dealt,
      gameOver,
    },
  };
};

export const rerollPrice = (config: GameConfig, state: GameState): number => config.rerollCost * (state.rerolls + 1);

export const canAffordReroll = (config: GameConfig, state: GameState): boolean =>
  state.coins >= rerollPrice(config, state);

const reroll = (config: GameConfig, state: GameState): GameState => {
  const cost = rerollPrice(config, state);
  if (state.coins < cost) return state;

  const deal = dealTray(state.seed, {
    board: state.board,
    catalog: config.catalog,
    palette: config.palette,
    size: config.traySize,
    nextPieceId: state.nextPieceId,
    level: difficultyLevel(state.moves, config.difficultyRampMoves),
  });
  const gameOver = !anyPieceFits(state.board, deal.tray);
  const eventSeq = state.eventSeq + 1;

  return {
    ...state,
    status: gameOver ? 'over' : 'playing',
    tray: deal.tray,
    seed: deal.seed,
    nextPieceId: deal.nextPieceId,
    coins: state.coins - cost,
    rerolls: state.rerolls + 1,
    eventSeq,
    lastEvent: { type: 'rerolled', seq: eventSeq, cost, gameOver },
  };
};

export const createGameReducer =
  (config: GameConfig) =>
  (state: GameState, action: GameAction): GameState => {
    switch (action.type) {
      case 'place':
        return place(config, state, action.pieceId, action.origin);
      case 'reroll':
        return reroll(config, state);
      case 'restart':
        return createGame(config, {
          seed: action.seed,
          best: state.best,
          coins: state.coins,
          eventSeq: state.eventSeq,
        });
    }
  };
