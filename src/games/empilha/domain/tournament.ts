import { type CharacterId, getCharacter } from './characters';

export type TournamentRound = 0 | 1 | 2;

export interface Competitor {
  readonly id: string;
  readonly name: string;
  readonly characterId: CharacterId | null;
  readonly isPlayer: boolean;
}

export interface TournamentMatch {
  readonly id: string;
  readonly round: TournamentRound;
  readonly competitor1: Competitor;
  readonly competitor2: Competitor;
  readonly score1: number;
  readonly score2: number;
  readonly winnerId: string | null;
  readonly status: 'pending' | 'active' | 'completed';
}

export interface TournamentState {
  readonly id: string;
  readonly status: 'in_progress' | 'won' | 'eliminated';
  readonly currentRound: TournamentRound;
  readonly matches: readonly TournamentMatch[];
  readonly trophiesCount: number;
}

export const ROUND_NAMES: Record<TournamentRound, string> = {
  0: 'Quartas de Final',
  1: 'Semifinais',
  2: 'Grande Final',
};

const DEFAULT_PLAYER: Competitor = {
  id: 'player',
  name: 'Você',
  characterId: null,
  isPlayer: true,
};

const OPPONENTS: readonly Competitor[] = [
  { id: 'tata', name: 'Tatá', characterId: 'tata', isPlayer: false },
  { id: 'rabito', name: 'Rabito', characterId: 'rabito', isPlayer: false },
  { id: 'porquinha', name: 'Porquinha', characterId: 'porquinha', isPlayer: false },
  { id: 'puga', name: 'Puga', characterId: 'puga', isPlayer: false },
  { id: 'lobo', name: 'Lobo', characterId: 'lobo', isPlayer: false },
  { id: 'elefantinho', name: 'Elefantinho', characterId: 'elefantinho', isPlayer: false },
  { id: 'tata_jr', name: 'Tatá Jr.', characterId: 'tata', isPlayer: false },
];

const getOpponent = (index: number): Competitor =>
  OPPONENTS[index] ?? { id: `bot-${index}`, name: `Rival ${index + 1}`, characterId: 'tata', isPlayer: false };

export const createTournament = (trophiesCount = 0): TournamentState => {
  const qfMatches: TournamentMatch[] = [
    {
      id: 'qf-1',
      round: 0,
      competitor1: DEFAULT_PLAYER,
      competitor2: getOpponent(0),
      score1: 0,
      score2: 0,
      winnerId: null,
      status: 'active',
    },
    {
      id: 'qf-2',
      round: 0,
      competitor1: getOpponent(1),
      competitor2: getOpponent(2),
      score1: 0,
      score2: 0,
      winnerId: null,
      status: 'pending',
    },
    {
      id: 'qf-3',
      round: 0,
      competitor1: getOpponent(3),
      competitor2: getOpponent(4),
      score1: 0,
      score2: 0,
      winnerId: null,
      status: 'pending',
    },
    {
      id: 'qf-4',
      round: 0,
      competitor1: getOpponent(5),
      competitor2: getOpponent(6),
      score1: 0,
      score2: 0,
      winnerId: null,
      status: 'pending',
    },
  ];

  return {
    id: `tour-${Date.now()}`,
    status: 'in_progress',
    currentRound: 0,
    matches: qfMatches,
    trophiesCount,
  };
};

const simulateAiMatch = (comp1: Competitor, comp2: Competitor): { winner: Competitor; score1: number; score2: number } => {
  const char1 = comp1.characterId ? getCharacter(comp1.characterId) : null;
  const char2 = comp2.characterId ? getCharacter(comp2.characterId) : null;
  const skill1 = char1?.bot.skill ?? 0.7;
  const skill2 = char2?.bot.skill ?? 0.7;

  const roll1 = Math.random() * 0.4 + skill1 * 0.6;
  const roll2 = Math.random() * 0.4 + skill2 * 0.6;

  if (roll1 >= roll2) {
    return { winner: comp1, score1: 370, score2: Math.floor(260 + Math.random() * 100) };
  }
  return { winner: comp2, score1: Math.floor(260 + Math.random() * 100), score2: 370 };
};

export const advanceTournament = (
  tournament: TournamentState,
  playerWon: boolean,
  playerScore: number,
  opponentScore: number,
): TournamentState => {
  const currentMatches = [...tournament.matches];
  const round = tournament.currentRound;

  const playerMatchIndex = currentMatches.findIndex(
    (m) => m.round === round && (m.competitor1.isPlayer || m.competitor2.isPlayer),
  );
  if (playerMatchIndex === -1) return tournament;

  const playerMatch = currentMatches[playerMatchIndex];
  if (!playerMatch) return tournament;

  const updatedPlayerMatch: TournamentMatch = {
    ...playerMatch,
    score1: playerMatch.competitor1.isPlayer ? playerScore : opponentScore,
    score2: playerMatch.competitor2.isPlayer ? playerScore : opponentScore,
    winnerId: playerWon ? 'player' : playerMatch.competitor2.id,
    status: 'completed',
  };
  currentMatches[playerMatchIndex] = updatedPlayerMatch;

  if (!playerWon) {
    return {
      ...tournament,
      status: 'eliminated',
      matches: currentMatches,
    };
  }

  for (let i = 0; i < currentMatches.length; i++) {
    const match = currentMatches[i];
    if (match && match.round === round && match.status === 'pending') {
      const sim = simulateAiMatch(match.competitor1, match.competitor2);
      currentMatches[i] = {
        ...match,
        score1: sim.score1,
        score2: sim.score2,
        winnerId: sim.winner.id,
        status: 'completed',
      };
    }
  }

  if (round === 2) {
    return {
      ...tournament,
      status: 'won',
      trophiesCount: tournament.trophiesCount + 1,
      matches: currentMatches,
    };
  }

  const nextRound = (round + 1) as TournamentRound;
  const winners: Competitor[] = [];
  for (const m of currentMatches.filter((m) => m.round === round)) {
    const winner = m.winnerId === m.competitor1.id ? m.competitor1 : m.competitor2;
    winners.push(winner);
  }

  const nextMatches: TournamentMatch[] = [];
  for (let i = 0; i < winners.length; i += 2) {
    const comp1 = winners[i];
    const comp2 = winners[i + 1];
    if (comp1 && comp2) {
      const isPlayerInvolved = comp1.isPlayer || comp2.isPlayer;
      nextMatches.push({
        id: `${nextRound === 1 ? 'sf' : 'f'}-${i / 2 + 1}`,
        round: nextRound,
        competitor1: comp1,
        competitor2: comp2,
        score1: 0,
        score2: 0,
        winnerId: null,
        status: isPlayerInvolved ? 'active' : 'pending',
      });
    }
  }

  return {
    ...tournament,
    currentRound: nextRound,
    matches: [...currentMatches, ...nextMatches],
  };
};

export const getActiveTournamentMatch = (tournament: TournamentState): TournamentMatch | null =>
  tournament.matches.find((m) => m.round === tournament.currentRound && m.status === 'active') ?? null;
