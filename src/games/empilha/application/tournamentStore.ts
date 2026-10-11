import type { KeyValueStore } from './ports';
import { createTournament, type TournamentState } from '../domain/tournament';

export const TOURNAMENT_KEY = 'tournament_state';

export const loadTournament = (store: KeyValueStore): TournamentState => {
  const raw = store.read(TOURNAMENT_KEY) as TournamentState | undefined;
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.matches)) {
    return createTournament(0);
  }
  return raw;
};

export const saveTournament = (store: KeyValueStore, tournament: TournamentState): void => {
  store.write(TOURNAMENT_KEY, tournament);
};
