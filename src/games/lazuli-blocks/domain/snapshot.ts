import type { BoardCell } from './board';
import { anyPieceFits, type TrayPiece, type TraySlot } from './dealer';
import type { GameConfig, GameState } from './game';
import { GEM_KINDS, isGemKind, type GemKind } from './gem';
import { gridFromCells } from '@shared/domain/grid';
import { findCompletedLines, lineTotal } from './lines';
import { findShape } from './shapes';

/** Compact, versioned, JSON-safe representation of a game in progress. */
export interface GameSnapshot {
  readonly version: 1;
  readonly cols: number;
  readonly rows: number;
  /** One character per cell, row-major: `.` for empty, otherwise a gem code. */
  readonly board: string;
  readonly tray: readonly (SavedPiece | null)[];
  readonly score: number;
  readonly best: number;
  readonly coins: number;
  readonly runCoins: number;
  readonly streak: number;
  readonly movesSinceClear: number;
  readonly moves: number;
  readonly rerolls: number;
  readonly seed: number;
  readonly nextPieceId: number;
  readonly eventSeq: number;
}

export interface SavedPiece {
  readonly id: number;
  readonly shape: string;
  readonly gem: GemKind;
}

const GEM_CODES: Readonly<Record<GemKind, string>> = {
  sapphire: 's',
  ruby: 'r',
  emerald: 'e',
  amethyst: 'a',
  topaz: 't',
};

const GEM_BY_CODE = new Map<string, GemKind>(GEM_KINDS.map((gem) => [GEM_CODES[gem], gem]));

export const toSnapshot = (state: GameState): GameSnapshot => ({
  version: 1,
  cols: state.board.cols,
  rows: state.board.rows,
  board: state.board.cells.map((cell) => (cell === null ? '.' : GEM_CODES[cell])).join(''),
  tray: state.tray.map((piece) => (piece ? { id: piece.id, shape: piece.shape.id, gem: piece.gem } : null)),
  score: state.score,
  best: state.best,
  coins: state.coins,
  runCoins: state.runCoins,
  streak: state.streak,
  movesSinceClear: state.movesSinceClear,
  moves: state.moves,
  rerolls: state.rerolls,
  seed: state.seed,
  nextPieceId: state.nextPieceId,
  eventSeq: state.eventSeq,
});

type UnknownRecord = Readonly<Record<string, unknown>>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readCount = (record: UnknownRecord, key: string): number | null => {
  const value = record[key];
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
};

const readPiece = (raw: unknown, config: GameConfig): TraySlot | undefined => {
  if (raw === null) return null;
  if (!isRecord(raw)) return undefined;
  const id = readCount(raw, 'id');
  const shapeId = raw.shape;
  const gem = raw.gem;
  const shape = typeof shapeId === 'string' ? findShape(config.catalog, shapeId) : undefined;
  if (id === null || !shape || !isGemKind(gem)) return undefined;
  const piece: TrayPiece = { id, shape, gem };
  return piece;
};

/** Validates untrusted storage data; returns null whenever anything is off. */
export const fromSnapshot = (raw: unknown, config: GameConfig): GameState | null => {
  if (!isRecord(raw) || raw.version !== 1) return null;
  if (raw.cols !== config.cols || raw.rows !== config.rows) return null;

  const boardCode = raw.board;
  if (typeof boardCode !== 'string' || boardCode.length !== config.cols * config.rows) return null;
  const cells: BoardCell[] = [];
  for (const char of boardCode) {
    if (char === '.') cells.push(null);
    else {
      const gem = GEM_BY_CODE.get(char);
      if (!gem) return null;
      cells.push(gem);
    }
  }
  const board = gridFromCells(config.cols, config.rows, cells);
  if (lineTotal(findCompletedLines(board)) > 0) return null;

  const rawTray = raw.tray;
  if (!Array.isArray(rawTray) || rawTray.length !== config.traySize) return null;
  const tray: TraySlot[] = [];
  for (const entry of rawTray as readonly unknown[]) {
    const piece = readPiece(entry, config);
    if (piece === undefined) return null;
    tray.push(piece);
  }
  if (tray.every((piece) => piece === null)) return null;

  const counts = {
    score: readCount(raw, 'score'),
    best: readCount(raw, 'best'),
    coins: readCount(raw, 'coins'),
    runCoins: readCount(raw, 'runCoins'),
    streak: readCount(raw, 'streak'),
    movesSinceClear: readCount(raw, 'movesSinceClear'),
    moves: readCount(raw, 'moves'),
    rerolls: readCount(raw, 'rerolls'),
    seed: readCount(raw, 'seed'),
    nextPieceId: readCount(raw, 'nextPieceId'),
    eventSeq: readCount(raw, 'eventSeq'),
  };
  const { score, best, coins, runCoins, streak, movesSinceClear, moves, rerolls, seed, nextPieceId, eventSeq } = counts;
  if (
    score === null ||
    best === null ||
    coins === null ||
    runCoins === null ||
    streak === null ||
    movesSinceClear === null ||
    moves === null ||
    rerolls === null ||
    seed === null ||
    seed > 0xffffffff ||
    nextPieceId === null ||
    eventSeq === null
  ) {
    return null;
  }

  return {
    status: anyPieceFits(board, tray) ? 'playing' : 'over',
    board,
    tray,
    score,
    best: Math.max(best, score),
    coins,
    runCoins,
    streak,
    movesSinceClear,
    moves,
    rerolls,
    seed,
    nextPieceId,
    eventSeq,
    lastEvent: null,
  };
};
