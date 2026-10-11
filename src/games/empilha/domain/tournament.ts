import { CAST_IDS, isCastId, type CastId } from '@shared/cast/cast';
import { nextInt, toSeed, type Seed } from '@shared/domain/rng';
import { simulateDuel } from './duel';
import type { Rules } from './rules';

export type Entrant = 'player' | CastId;

/** One match of the bracket; `winner` stays null until it is played. */
export interface Pairing {
  /** null while the previous round has not decided who takes the seat. */
  readonly a: Entrant | null;
  readonly b: Entrant | null;
  readonly winner: Entrant | null;
}

/**
 * Single-elimination bracket of eight: you and seven of the cast. Matches between cast members
 * are simulated the moment their round starts; yours waits for you to play it.
 * Stored as seed + slots + winners, everything else is derived.
 */
export interface Tournament {
  readonly seed: Seed;
  /** Round 0 seeding, two neighbours per match. */
  readonly slots: readonly Entrant[];
  /** winners[round][match], null while pending. */
  readonly winners: readonly (readonly (Entrant | null)[])[];
}

export const ROUNDS = 3;
export const ROUND_NAMES: readonly string[] = ['Quartas de final', 'Semifinal', 'Final'];

const shuffle = <T>(items: readonly T[], seed: Seed): T[] => {
  const result = [...items];
  let current = seed;
  for (let index = result.length - 1; index > 0; index -= 1) {
    const roll = nextInt(current, index + 1);
    current = roll.seed;
    const swap = result[roll.value];
    const here = result[index];
    if (swap !== undefined && here !== undefined) {
      result[index] = swap;
      result[roll.value] = here;
    }
  }
  return result;
};

const matchesIn = (round: number): number => 2 ** (ROUNDS - 1 - round);

export const pairingsOf = (tournament: Tournament, round: number): readonly Pairing[] => {
  const previous = round === 0 ? tournament.slots : (tournament.winners[round - 1] ?? []);
  return Array.from({ length: matchesIn(round) }, (_, match) => ({
    a: previous[match * 2] ?? null,
    b: previous[match * 2 + 1] ?? null,
    winner: tournament.winners[round]?.[match] ?? null,
  }));
};

/** The round being played: the first with a pending match, or ROUNDS when the bracket is over. */
export const currentRound = (tournament: Tournament): number => {
  for (let round = 0; round < ROUNDS; round += 1) {
    if ((tournament.winners[round]?.filter((winner) => winner !== null).length ?? 0) < matchesIn(round)) return round;
  }
  return ROUNDS;
};

/** Cast member the player faces next, or null when the player is out or already champion. */
export const nextRival = (tournament: Tournament): CastId | null => {
  const round = currentRound(tournament);
  if (round >= ROUNDS) return null;
  const pending = pairingsOf(tournament, round).find((pairing) => pairing.winner === null && (pairing.a === 'player' || pairing.b === 'player'));
  if (!pending) return null;
  const other = pending.a === 'player' ? pending.b : pending.a;
  return other === 'player' ? null : other;
};

export type TournamentStatus = 'playing' | 'champion' | 'eliminated';

export const statusOf = (tournament: Tournament): TournamentStatus => {
  if (currentRound(tournament) >= ROUNDS) return tournament.winners[ROUNDS - 1]?.[0] === 'player' ? 'champion' : 'eliminated';
  return nextRival(tournament) === null ? 'eliminated' : 'playing';
};

/** Plays every pending match that does not involve the player. */
const simulatePending = (rules: Rules, tournament: Tournament): Tournament => {
  let winners = tournament.winners.map((round) => [...round]);
  for (let round = currentRound(tournament); round < ROUNDS; round += 1) {
    const current: Tournament = { ...tournament, winners };
    const pairings = pairingsOf(current, round);
    const existing = winners[round];
    const row: (Entrant | null)[] = existing ? [...existing] : pairings.map(() => null);
    pairings.forEach((pairing, match) => {
      if (row[match] !== null && row[match] !== undefined) return;
      if (pairing.a === null || pairing.b === null || pairing.a === 'player' || pairing.b === 'player') return;
      const duel = simulateDuel(rules, pairing.a, pairing.b, toSeed(tournament.seed + round * 101 + match * 17 + 1));
      row[match] = duel.winner === 'first' ? pairing.a : pairing.b;
    });
    winners = [...winners.slice(0, round), row, ...winners.slice(round + 1)];
    // Stop at a round still waiting for the player; the next one cannot be paired yet.
    if (row.some((winner) => winner === null)) break;
  }
  return { ...tournament, winners };
};

export const createTournament = (rules: Rules, seed: Seed): Tournament => {
  const safeSeed = toSeed(seed);
  const cast = shuffle(CAST_IDS, safeSeed).slice(0, 7);
  const slots = shuffle<Entrant>(['player', ...cast], toSeed(safeSeed ^ 0x2545f491));
  return simulatePending(rules, { seed: safeSeed, slots, winners: [] });
};

/** Records the player's result for the pending match, then plays what that unlocks. */
export const recordPlayerResult = (rules: Rules, tournament: Tournament, won: boolean): Tournament => {
  const round = currentRound(tournament);
  if (round >= ROUNDS) return tournament;
  const pairings = pairingsOf(tournament, round);
  const match = pairings.findIndex((pairing) => pairing.winner === null && (pairing.a === 'player' || pairing.b === 'player'));
  const pairing = pairings[match];
  if (!pairing) return tournament;
  const opponent = pairing.a === 'player' ? pairing.b : pairing.a;
  if (opponent === null) return tournament;
  const row = tournament.winners[round] ? [...tournament.winners[round]] : pairings.map(() => null);
  row[match] = won ? 'player' : opponent;
  const next: Tournament = { ...tournament, winners: [...tournament.winners.slice(0, round), row, ...tournament.winners.slice(round + 1)] };
  // After a loss nobody waits for the player any more, so the rest of the bracket plays out and the champion is known.
  return simulatePending(rules, next);
};

export const championOf = (tournament: Tournament): Entrant | null => tournament.winners[ROUNDS - 1]?.[0] ?? null;

export const isEntrant = (value: unknown): value is Entrant => value === 'player' || isCastId(value);
