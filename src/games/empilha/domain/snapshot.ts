import { gridFromCells } from '@shared/domain/grid';
import { boardFromLayout, type Board, type Cell } from './board';
import type { TraySlot, TrayStack } from './dealer';
import type { EndReason, MatchState, MatchStatus } from './match';
import type { Rules } from './rules';
import type { Side } from './side';
import { stackFromCodes, type Stack } from './stack';
import { TILE_CODES } from './tiles';

/** Compact, versioned, JSON-safe match. Cells: `x` outside, `!90` locked until 90 points, `=sgg` open with tiles. */
export interface MatchSnapshot {
  readonly version: 1;
  readonly level: number;
  readonly target: number;
  readonly status: MatchStatus;
  readonly endReason: EndReason | null;
  readonly player: SideSnapshot;
  readonly opponent: SideSnapshot;
  readonly eventSeq: number;
}

export interface SideSnapshot {
  readonly board: readonly string[];
  readonly tray: readonly ({ readonly id: number; readonly tiles: string } | null)[];
  readonly score: number;
  readonly moves: number;
  readonly seed: number;
  readonly nextId: number;
}

const encodeStack = (stack: Stack): string => stack.map((color) => TILE_CODES[color]).join('');

const encodeCell = (cell: Cell): string => {
  switch (cell.kind) {
    case 'void':
      return 'x';
    case 'locked':
      return `!${cell.unlockAt}`;
    case 'open':
      return `=${encodeStack(cell.stack)}`;
  }
};

const encodeSide = (side: Side): SideSnapshot => ({
  board: side.board.cells.map(encodeCell),
  tray: side.tray.map((stack) => (stack ? { id: stack.id, tiles: encodeStack(stack.tiles) } : null)),
  score: side.score,
  moves: side.moves,
  seed: side.seed,
  nextId: side.nextId,
});

export const toSnapshot = (state: MatchState): MatchSnapshot => ({
  version: 1,
  level: state.level,
  target: state.target,
  status: state.status,
  endReason: state.endReason,
  player: encodeSide(state.player),
  opponent: encodeSide(state.opponent),
  eventSeq: state.eventSeq,
});

/* ---------- decoding untrusted data ---------- */

type UnknownRecord = Readonly<Record<string, unknown>>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const count = (value: unknown): number | null =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;

const STATUSES: readonly MatchStatus[] = ['playing', 'won', 'lost'];
const REASONS: readonly EndReason[] = ['target', 'opponent-target', 'board-full', 'opponent-board-full'];

const decodeStack = (code: unknown): Stack | null => (typeof code === 'string' ? stackFromCodes(code) : null);

const decodeCell = (code: unknown, expected: Cell): Cell | null => {
  if (typeof code !== 'string') return null;
  // The board's shape is fixed by the rules: a save may only change what sits inside it.
  if (expected.kind === 'void') return code === 'x' ? expected : null;
  if (code.startsWith('!')) {
    const unlockAt = Number(code.slice(1));
    return expected.kind === 'locked' && Number.isSafeInteger(unlockAt) && unlockAt >= 0
      ? { kind: 'locked', unlockAt }
      : null;
  }
  if (code.startsWith('=')) {
    const stack = decodeStack(code.slice(1));
    return stack ? { kind: 'open', stack } : null;
  }
  return null;
};

const decodeSide = (raw: unknown, template: Board, traySize: number): Side | null => {
  if (!isRecord(raw)) return null;
  const { board: rawBoard, tray: rawTray } = raw;
  if (!Array.isArray(rawBoard) || rawBoard.length !== template.cells.length) return null;
  const cells: Cell[] = [];
  for (const [index, expected] of template.cells.entries()) {
    const cell = decodeCell((rawBoard as readonly unknown[])[index], expected);
    if (!cell) return null;
    cells.push(cell);
  }

  if (!Array.isArray(rawTray) || rawTray.length !== traySize) return null;
  const tray: TraySlot[] = [];
  for (const entry of rawTray as readonly unknown[]) {
    if (entry === null) {
      tray.push(null);
      continue;
    }
    if (!isRecord(entry)) return null;
    const id = count(entry.id);
    const tiles = decodeStack(entry.tiles);
    if (id === null || !tiles || tiles.length === 0) return null;
    const stack: TrayStack = { id, tiles };
    tray.push(stack);
  }
  if (tray.every((entry) => entry === null)) return null;

  const score = count(raw.score);
  const moves = count(raw.moves);
  const seed = count(raw.seed);
  const nextId = count(raw.nextId);
  if (score === null || moves === null || seed === null || seed > 0xffffffff || nextId === null) return null;

  return { board: gridFromCells(template.cols, template.rows, cells), tray, score, moves, seed, nextId };
};

/** Validates untrusted storage data; returns null whenever anything is off. */
export const fromSnapshot = (raw: unknown, rules: Rules): MatchState | null => {
  if (!isRecord(raw) || raw.version !== 1) return null;
  const level = count(raw.level);
  const target = count(raw.target);
  const eventSeq = count(raw.eventSeq);
  const status = STATUSES.find((value) => value === raw.status);
  const endReason = raw.endReason === null ? null : (REASONS.find((value) => value === raw.endReason) ?? undefined);
  if (level === null || level < 1 || target === null || target < 1 || eventSeq === null) return null;
  if (!status || endReason === undefined || (status === 'playing') !== (endReason === null)) return null;

  const template = boardFromLayout(rules.layout);
  const player = decodeSide(raw.player, template, rules.traySize);
  const opponent = decodeSide(raw.opponent, template, rules.traySize);
  if (!player || !opponent) return null;

  return { level, target, status, endReason, player, opponent, eventSeq, lastEvent: null };
};
