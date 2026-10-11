import { describe, expect, it, vi } from 'vitest';
import type { KeyValueStore } from '@shared/application/ports';
import { chooseMove, DEFAULT_RULES } from '../../domain';
import { createMatchStore, loadSession } from '../matchStore';
import { EMPTY_STATS, loadStats, recordResult } from '../stats';

const memoryStore = (initial: Record<string, unknown> = {}): KeyValueStore => {
  const data = new Map(Object.entries(initial).map(([key, value]) => [key, JSON.stringify(value)]));
  return {
    read: (key) => {
      const raw = data.get(key);
      return raw === undefined ? undefined : (JSON.parse(raw) as unknown);
    },
    write: (key, value) => {
      data.set(key, JSON.stringify(value));
    },
  };
};

const deps = (store: KeyValueStore) => ({ rules: DEFAULT_RULES, store, seedSource: () => 4321 });

describe('stats', () => {
  it('sanitizes stored stats', () => {
    expect(loadStats(memoryStore())).toEqual(EMPTY_STATS);
    expect(loadStats(memoryStore({ stats: { level: 0, wins: -2, losses: 'x', streak: 1.5 } }))).toEqual(EMPTY_STATS);
  });

  it('counts a finished match once and moves up a level on a win', () => {
    const { match } = loadSession(deps(memoryStore()));
    const won = { ...match, status: 'won' as const, endReason: 'target' as const, eventSeq: 9 };
    const after = recordResult(EMPTY_STATS, won);
    expect(after).toMatchObject({ level: 2, wins: 1, streak: 1, bestStreak: 1, recordedSeq: 9 });
    expect(recordResult(after, won)).toBe(after);

    const lost = { ...won, status: 'lost' as const, endReason: 'opponent-target' as const, eventSeq: 15, level: 2 };
    expect(recordResult(after, lost)).toMatchObject({ level: 2, losses: 1, streak: 0, bestStreak: 1 });
  });
});

describe('match store', () => {
  it('starts a match at the saved level and persists it', () => {
    const store = memoryStore({ stats: { ...EMPTY_STATS, level: 3, wins: 2 } });
    const matchStore = createMatchStore(deps(store));
    expect(matchStore.getState().match.level).toBe(3);
    expect(store.read('match')).toMatchObject({ version: 1, level: 3 });
  });

  it('returns the next session synchronously and notifies subscribers', () => {
    const matchStore = createMatchStore(deps(memoryStore()));
    const listener = vi.fn();
    matchStore.subscribe(listener);
    const { move } = chooseMove(matchStore.getState().match.player, DEFAULT_RULES, 1, 1);
    if (!move) throw new Error('fixture needs a move');

    const next = matchStore.dispatch({ type: 'place', slot: move.slot, at: move.at });
    expect(next).toBe(matchStore.getState());
    expect(next.match.lastEvent?.type).toBe('playerPlaced');
    expect(listener).toHaveBeenCalledTimes(1);

    // Illegal actions change nothing and stay silent.
    expect(matchStore.dispatch({ type: 'place', slot: move.slot, at: move.at })).toBe(next);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('resumes the saved match after a reload', () => {
    const store = memoryStore();
    const first = createMatchStore(deps(store));
    first.dispatch({ type: 'opponentTurn' });
    const resumed = createMatchStore({ ...deps(store), seedSource: () => 1 });
    expect(resumed.getState().match).toEqual({ ...first.getState().match, lastEvent: null });
  });
});
