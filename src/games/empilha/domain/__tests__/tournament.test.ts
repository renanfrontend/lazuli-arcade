import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES } from '../rules';
import {
  championOf,
  createTournament,
  currentRound,
  nextRival,
  pairingsOf,
  recordPlayerResult,
  ROUNDS,
  statusOf,
} from '../tournament';

describe('tournament', () => {
  it('seats the player and seven distinct cast members', () => {
    const tournament = createTournament(DEFAULT_RULES, 99);
    expect(tournament.slots).toHaveLength(8);
    expect(new Set(tournament.slots).size).toBe(8);
    expect(tournament.slots).toContain('player');
  });

  it('is deterministic for a seed', () => {
    expect(createTournament(DEFAULT_RULES, 5)).toEqual(createTournament(DEFAULT_RULES, 5));
  });

  it('simulates other matches and waits on the player', () => {
    const tournament = createTournament(DEFAULT_RULES, 7);
    const round = pairingsOf(tournament, 0);
    expect(round).toHaveLength(4);
    const mine = round.filter((pairing) => pairing.a === 'player' || pairing.b === 'player');
    expect(mine).toHaveLength(1);
    expect(mine[0]?.winner).toBeNull();
    expect(round.filter((pairing) => pairing.winner !== null)).toHaveLength(3);
    expect(statusOf(tournament)).toBe('playing');
    expect(nextRival(tournament)).not.toBeNull();
  });

  it('crowns the player after three wins', () => {
    let tournament = createTournament(DEFAULT_RULES, 21);
    for (let round = 0; round < ROUNDS; round += 1) {
      expect(currentRound(tournament)).toBe(round);
      expect(nextRival(tournament)).not.toBeNull();
      tournament = recordPlayerResult(DEFAULT_RULES, tournament, true);
    }
    expect(statusOf(tournament)).toBe('champion');
    expect(championOf(tournament)).toBe('player');
    expect(nextRival(tournament)).toBeNull();
  });

  it('eliminates the player on a loss and still finishes the bracket', () => {
    let tournament = createTournament(DEFAULT_RULES, 21);
    tournament = recordPlayerResult(DEFAULT_RULES, tournament, true);
    const rival = nextRival(tournament);
    tournament = recordPlayerResult(DEFAULT_RULES, tournament, false);
    expect(statusOf(tournament)).toBe('eliminated');
    expect(currentRound(tournament)).toBe(ROUNDS);
    expect(championOf(tournament)).not.toBe('player');
    expect(championOf(tournament)).not.toBeNull();
    expect(rival).not.toBeNull();
  });

  it('ignores results once the bracket is over', () => {
    let tournament = createTournament(DEFAULT_RULES, 3);
    tournament = recordPlayerResult(DEFAULT_RULES, tournament, false);
    expect(recordPlayerResult(DEFAULT_RULES, tournament, true)).toBe(tournament);
  });
});
