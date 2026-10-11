import { describe, expect, it } from 'vitest';
import { createGrid, isGridOver, mergeLine, moveGrid, restoreGrid, slideGrid, type GridState } from './game';
const state = (board: number[]): GridState => ({ board: [...board, ...Array<number>(16 - board.length).fill(0)], score: 0, seed: 42 });
describe('2048', () => {
  it('starts with two tiles using repeatable randomness', () => { expect(createGrid(12)).toEqual(createGrid(12)); expect(createGrid(12).board.filter(Boolean)).toHaveLength(2); });
  it('merges each tile only once', () => { expect(mergeLine([2,2,2,2])).toEqual({line:[4,4,0,0],score:8}); expect(mergeLine([2,2,4,0])).toEqual({line:[4,4,0,0],score:4}); });
  it('compresses gaps before merging', () => { expect(mergeLine([2,0,2,4])).toEqual({line:[4,4,0,0],score:4}); });
  it('slides all four directions with correct ordering', () => {
    expect(slideGrid(state([2,2]), 'left').board.slice(0,4)).toEqual([4,0,0,0]); expect(slideGrid(state([2,2]), 'right').board.slice(0,4)).toEqual([0,0,0,4]);
    const vertical = state([2,0,0,0,2]); expect(slideGrid(vertical,'up').board[0]).toBe(4); expect(slideGrid(vertical,'down').board[12]).toBe(4);
  });
  it('does not add a tile or change randomness on invalid moves', () => { const s = state([2,4]); expect(moveGrid(s,'left')).toBe(s); });
  it('adds exactly one tile after a valid move and preserves the input', () => { const s = state([2,2]), next = moveGrid(s,'left'); expect(next.board.filter(Boolean)).toHaveLength(2); expect(next.score).toBe(4); expect(s.board[0]).toBe(2); });
  it('detects a full blocked board and allows merges on a full board', () => {
    const blocked = state([2,4,2,4,4,2,4,2,2,4,2,4,4,2,4,2]); expect(isGridOver(blocked)).toBe(true);
    expect(isGridOver(state([2,2,2,4,4,2,4,2,2,4,2,4,4,2,4,2]))).toBe(false); expect(isGridOver(createGrid(2))).toBe(false);
  });
  it('allows building beyond 2048', () => { expect(slideGrid(state([2048,2048]),'left').board[0]).toBe(4096); });
  it('restores valid saves and rejects invalid values and scores', () => {
    const s = createGrid(2); expect(restoreGrid(s)).toEqual(s); expect(restoreGrid({...s, score:NaN})).toBeNull(); expect(restoreGrid({...s, board:[3,...s.board.slice(1)]})).toBeNull(); expect(restoreGrid({...s, board:Array(16).fill(0)})).toBeNull();
  });
  it('replaying a saved previous position restores the same random spawn', () => { const s = state([2,2]); expect(moveGrid(s,'left')).toEqual(moveGrid(restoreGrid(s) ?? s,'left')); });
});
