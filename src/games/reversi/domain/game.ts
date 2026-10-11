import { nextInt } from '@shared/domain/rng';

export type Player = 1 | -1;
export type Board = readonly number[];
export type Difficulty = 'easy' | 'normal' | 'hard';
export interface ReversiState { readonly board: Board; readonly turn: Player; readonly over: boolean; readonly passed: Player | null }
const directions = [-1, 0, 1].flatMap((y) => [-1, 0, 1].filter((x) => x !== 0 || y !== 0).map((x) => [x, y] as const));
const corners = [0, 7, 56, 63];
export const opponent = (player: Player): Player => player === 1 ? -1 : 1;
export function initialReversi(): ReversiState {
  const board = Array<number>(64).fill(0);
  board[27] = -1; board[28] = 1; board[35] = 1; board[36] = -1;
  return { board, turn: 1, over: false, passed: null };
}
export function captures(board: Board, index: number, player: Player): number[] {
  if (index < 0 || index >= 64 || !Number.isInteger(index) || board[index] !== 0) return [];
  const result: number[] = [];
  for (const [dx, dy] of directions) {
    let x = index % 8 + dx, y = Math.floor(index / 8) + dy;
    const line: number[] = [];
    while (x >= 0 && x < 8 && y >= 0 && y < 8 && board[y * 8 + x] === -player) {
      line.push(y * 8 + x); x += dx; y += dy;
    }
    if (line.length && x >= 0 && x < 8 && y >= 0 && y < 8 && board[y * 8 + x] === player) result.push(...line);
  }
  return result;
}
export const legalMoves = (board: Board, player: Player): number[] => board.flatMap((value, index) => value === 0 && captures(board, index, player).length ? [index] : []);
export const countDiscs = (board: Board, player: Player): number => board.filter((value) => value === player).length;
export function playReversi(state: ReversiState, index: number): ReversiState {
  if (state.over) return state;
  const flipped = captures(state.board, index, state.turn);
  if (!flipped.length) return state;
  const board = [...state.board]; board[index] = state.turn;
  for (const cell of flipped) board[cell] = state.turn;
  const next = opponent(state.turn);
  if (legalMoves(board, next).length) return { board, turn: next, over: false, passed: null };
  if (legalMoves(board, state.turn).length) return { board, turn: state.turn, over: false, passed: next };
  return { board, turn: next, over: true, passed: null };
}
function evaluate(board: Board, player: Player): number {
  const other = opponent(player);
  let score = 0;
  for (let i = 0; i < 64; i++) {
    const disc = board[i] ?? 0;
    const x = i % 8, y = Math.floor(i / 8);
    const weight = corners.includes(i) ? 160 : (x === 0 || x === 7 || y === 0 || y === 7) ? 12 : 1;
    score += disc * player * weight;
  }
  // Squares beside an empty corner are vulnerable to a corner capture.
  for (const corner of corners) {
    if (board[corner] !== 0) continue;
    const dx = corner % 8 === 0 ? 1 : -1, dy = corner < 8 ? 8 : -8;
    for (const index of [corner + dx, corner + dy, corner + dx + dy]) score -= (board[index] ?? 0) * player * 45;
  }
  score += 9 * (legalMoves(board, player).length - legalMoves(board, other).length);
  if (board.filter((v) => v === 0).length < 12) score += 8 * (countDiscs(board, player) - countDiscs(board, other));
  return score;
}
/** Bounded alpha-beta search, with pass turns represented explicitly in the game state. */
export function chooseMove(state: ReversiState, difficulty: Difficulty, seed: number): number | null {
  const moves = legalMoves(state.board, state.turn);
  if (state.over || !moves.length) return null;
  if (difficulty === 'easy') return moves[nextInt(seed, moves.length).value] ?? null;
  const root = state.turn;
  let nodes = 0;
  const search = (position: ReversiState, depth: number, alpha: number, beta: number): number => {
    nodes++;
    if (position.over) {
      const delta = countDiscs(position.board, root) - countDiscs(position.board, opponent(root));
      return delta === 0 ? 0 : Math.sign(delta) * 100_000 + delta;
    }
    if (depth === 0 || nodes > 20_000) return evaluate(position.board, root);
    const maximizing = position.turn === root;
    let best = maximizing ? -Infinity : Infinity;
    const options = legalMoves(position.board, position.turn).sort((a, b) => Number(corners.includes(b)) - Number(corners.includes(a)));
    for (const index of options) {
      const score = search(playReversi(position, index), depth - 1, alpha, beta);
      best = maximizing ? Math.max(best, score) : Math.min(best, score);
      if (maximizing) alpha = Math.max(alpha, best); else beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  };
  let selected = moves[0] ?? null, best = -Infinity;
  const depth = difficulty === 'hard' ? 4 : 2;
  for (const index of moves) {
    const value = search(playReversi(state, index), depth - 1, best, Infinity);
    if (value > best) { best = value; selected = index; }
  }
  return selected;
}
export function restoreReversi(raw: unknown): ReversiState | null {
  if (typeof raw !== 'object' || raw === null || !('board' in raw) || !('turn' in raw)) return null;
  if (!Array.isArray(raw.board) || raw.board.length !== 64 || !raw.board.every((v: unknown) => v === 0 || v === 1 || v === -1) || (raw.turn !== 1 && raw.turn !== -1)) return null;
  const board: number[] = raw.board;
  const turn = raw.turn;
  const options = legalMoves(board, turn), otherOptions = legalMoves(board, opponent(turn));
  if (!options.length && otherOptions.length) return { board, turn: opponent(turn), over: false, passed: turn };
  return { board, turn, over: !options.length && !otherOptions.length, passed: null };
}
