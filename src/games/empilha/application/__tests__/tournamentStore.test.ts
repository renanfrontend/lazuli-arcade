import { describe, expect, it, vi } from 'vitest';
import type { KeyValueStore } from '@shared/application/ports';
import { createMatch, DEFAULT_RULES, nextRival } from '../../domain';
import { createTournamentStore, isBracketMatch, loadTournament } from '../tournamentStore';

const memoryStore = (): KeyValueStore => {
  const data = new Map<string, string>();
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

const finished = (opponentId: Parameters<typeof createMatch>[1]['opponentId'], seq: number, won: boolean) => ({
  ...createMatch(DEFAULT_RULES, { opponentId, seed: 1, eventSeq: seq - 1 }),
  status: won ? ('won' as const) : ('lost' as const),
  endReason: won ? ('target' as const) : ('opponent-target' as const),
});

describe('tournament store', () => {
  it('starts a bracket and survives a reload', () => {
    const store = memoryStore();
    const first = createTournamentStore(store, DEFAULT_RULES);
    expect(first.getState()).toBeNull();
    const session = first.start(1234);
    expect(session.status).toBe('playing');
    expect(createTournamentStore(store, DEFAULT_RULES).getState()?.tournament).toEqual(session.tournament);
  });

  it('counts only the match it started, once', () => {
    const tournaments = createTournamentStore(memoryStore(), DEFAULT_RULES);
    const listener = vi.fn();
    tournaments.subscribe(listener);
    const { tournament } = tournaments.start(55);
    const rival = nextRival(tournament);
    if (!rival) throw new Error('fixture needs a rival');

    const won = finished(rival, 10, true);
    expect(tournaments.settle(won)).toBe(false);
    expect(tournaments.getState()?.save.results).toEqual([]);

    tournaments.beginMatch(10);
    tournaments.settle(won);
    expect(tournaments.getState()?.save.results).toEqual([true]);
    tournaments.settle(won);
    expect(tournaments.getState()?.save.results).toEqual([true]);
    expect(listener).toHaveBeenCalled();
  });

  it('keeps a match in the bracket as its eventSeq grows with moves, until it is unlinked', () => {
    const tournaments = createTournamentStore(memoryStore(), DEFAULT_RULES);
    const { save } = tournaments.start(5);
    const rival = nextRival(tournaments.getState()?.tournament ?? ({} as never));
    if (!rival) throw new Error('fixture needs a rival');
    tournaments.beginMatch(10);
    const later = finished(rival, 17, false);
    expect(isBracketMatch(tournaments.getState()?.save ?? save, later)).toBe(true);
    expect(tournaments.settle(later)).toBe(false);
    expect(tournaments.getState()?.status).toBe('eliminated');
    tournaments.beginMatch(null);
    expect(isBracketMatch(tournaments.getState()?.save ?? save, later)).toBe(false);
  });

  it('crowns a champion after three straight wins and ends after a loss', () => {
    const tournaments = createTournamentStore(memoryStore(), DEFAULT_RULES);
    tournaments.start(77);
    let champion = false;
    for (let round = 0; round < 3; round += 1) {
      const rival = nextRival(tournaments.getState()?.tournament ?? ({} as never));
      if (!rival) throw new Error('missing rival');
      tournaments.beginMatch(100 + round);
      champion = tournaments.settle(finished(rival, 100 + round, true));
    }
    expect(champion).toBe(true);
    expect(tournaments.getState()?.status).toBe('champion');

    tournaments.start(78);
    const rival = nextRival(tournaments.getState()?.tournament ?? ({} as never));
    if (!rival) throw new Error('missing rival');
    tournaments.beginMatch(200);
    expect(tournaments.settle(finished(rival, 200, false))).toBe(false);
    expect(tournaments.getState()?.status).toBe('eliminated');
  });

  it('rejects corrupt saves', () => {
    const store = memoryStore();
    for (const bad of [{ seed: -1, results: [], matchSeq: null, recordedSeq: 0 }, { seed: 1, results: ['x'], matchSeq: null, recordedSeq: 0 }, { seed: 1, results: [true, true, true, true], matchSeq: null, recordedSeq: 0 }, 'x']) {
      store.write('tournament', bad);
      expect(loadTournament(store, DEFAULT_RULES)).toBeNull();
    }
  });
});
