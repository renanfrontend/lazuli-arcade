import { describe, expect, it } from 'vitest';
import { CHARACTERS, getCharacter, getCharacterByLevel } from '../characters';
import {
  advanceTournament,
  createTournament,
  getActiveTournamentMatch,
} from '../tournament';

describe('characters', () => {
  it('defines all 6 animal characters requested', () => {
    const ids = CHARACTERS.map((c) => c.id);
    expect(ids).toContain('tata');
    expect(ids).toContain('rabito');
    expect(ids).toContain('lobo');
    expect(ids).toContain('porquinha');
    expect(ids).toContain('puga');
    expect(ids).toContain('elefantinho');
    expect(CHARACTERS.length).toBe(6);
  });

  it('provides distinct bot profiles for each character', () => {
    const tata = getCharacter('tata');
    const rabito = getCharacter('rabito');
    expect(tata.bot.thinkMs).toBeGreaterThan(rabito.bot.thinkMs);
  });

  it('cycles characters through levels', () => {
    expect(getCharacterByLevel(1).id).toBe('tata');
    expect(getCharacterByLevel(2).id).toBe('rabito');
    expect(getCharacterByLevel(3).id).toBe('lobo');
  });
});

describe('tournament', () => {
  it('creates an 8-competitor tournament bracket', () => {
    const tour = createTournament();
    expect(tour.status).toBe('in_progress');
    expect(tour.currentRound).toBe(0);
    expect(tour.matches.length).toBe(4);

    const active = getActiveTournamentMatch(tour);
    expect(active).not.toBeNull();
    expect(active?.competitor1.isPlayer).toBe(true);
  });

  it('advances player to semifinals when winning quarterfinal', () => {
    const tour = createTournament();
    const next = advanceTournament(tour, true, 370, 220);
    expect(next.currentRound).toBe(1);
    expect(next.status).toBe('in_progress');
    expect(next.matches.length).toBe(6);
  });

  it('marks tournament as eliminated when player loses', () => {
    const tour = createTournament();
    const next = advanceTournament(tour, false, 200, 370);
    expect(next.status).toBe('eliminated');
  });

  it('awards trophy when winning the final', () => {
    let tour = createTournament(0);
    tour = advanceTournament(tour, true, 370, 200);
    tour = advanceTournament(tour, true, 370, 250);
    tour = advanceTournament(tour, true, 370, 310);

    expect(tour.status).toBe('won');
    expect(tour.trophiesCount).toBe(1);
  });
});
