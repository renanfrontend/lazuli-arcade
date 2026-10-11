import { describe, expect, it } from 'vitest';
import { captures, chooseMove, countDiscs, initialReversi, legalMoves, playReversi, restoreReversi, type ReversiState } from './game';
describe('Reversi rules and CPU', () => {
  it('starts with four discs and four legal opening moves', () => {
    const state = initialReversi(); expect(countDiscs(state.board, 1)).toBe(2); expect(legalMoves(state.board, 1)).toEqual([19, 26, 37, 44]);
  });
  it('flips a bracketed disc and hands over the turn without mutating the input', () => {
    const state = initialReversi(), next = playReversi(state, 19);
    expect(next.turn).toBe(-1); expect(countDiscs(next.board, 1)).toBe(4); expect(countDiscs(state.board, 1)).toBe(2);
  });
  it('rejects occupied and unbracketed squares', () => {
    const state = initialReversi(); expect(playReversi(state, 0)).toBe(state); expect(playReversi(state, 27)).toBe(state); expect(captures(state.board, -1, 1)).toEqual([]);
  });
  it('captures in every direction and does not wrap rows', () => {
    const board = Array<number>(64).fill(0);
    for (const [dx, dy] of [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]]) {
      board[(3 + (dy ?? 0)) * 8 + 3 + (dx ?? 0)] = -1; board[(3 + 2 * (dy ?? 0)) * 8 + 3 + 2 * (dx ?? 0)] = 1;
    }
    expect(captures(board, 27, 1)).toHaveLength(8);
    const wrap = Array<number>(64).fill(0); wrap[8] = -1; wrap[9] = 1;
    expect(captures(wrap, 7, 1)).toEqual([]);
  });
  it('passes the opponent automatically when only the current player has a move', () => {
    const board = Array<number>(64).fill(1); board[0] = 0; board[1] = -1; board[56] = 0; board[57] = -1;
    const next = playReversi({board, turn: 1, over: false, passed: null}, 0);
    expect(next.over).toBe(false); expect(next.turn).toBe(1); expect(next.passed).toBe(-1);
  });
  it('ends when neither player has legal moves, even with empty squares', () => {
    const board = Array<number>(64).fill(1); board[0] = 0; board[1] = -1; board[63] = 0;
    const next = playReversi({board, turn: 1, over: false, passed: null}, 0);
    expect(next.over).toBe(true); expect(playReversi(next, 63)).toBe(next);
  });
  it('selects only legal CPU moves for each level', () => {
    const state = playReversi(initialReversi(), 19);
    for (const level of ['easy','normal','hard'] as const) expect(legalMoves(state.board, state.turn)).toContain(chooseMove(state, level, 7));
  });
  it('prefers a secure corner over a plain capture', () => {
    const board = Array<number>(64).fill(0); board[1] = -1; board[2] = 1; board[27] = -1; board[28] = 1;
    const state: ReversiState = {board, turn: 1, over: false, passed: null}; expect(chooseMove(state, 'hard', 1)).toBe(0);
  });
  it('restores valid saves, computes terminal state, and rejects damaged data', () => {
    expect(restoreReversi(initialReversi())).toEqual(initialReversi()); expect(restoreReversi({board:[0],turn:1})).toBeNull();
    expect(restoreReversi({board:Array(64).fill(1), turn:-1})?.over).toBe(true);
  });
  it('can finish an entire CPU match without getting stuck', () => {
    let state = initialReversi(); let turns = 0;
    while (!state.over && turns < 65) { const index = chooseMove(state, 'normal', 5); expect(index).not.toBeNull(); state = playReversi(state, index ?? 0); turns++; }
    expect(state.over).toBe(true); expect(turns).toBeLessThanOrEqual(60);
  });
});
