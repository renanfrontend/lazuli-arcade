import { describe, expect, it } from 'vitest';
import { parseRoute } from '../navigation';
import { findGame, GAMES } from '../registry';

describe('parseRoute', () => {
  it('reads a game slug from the hash', () => {
    expect(parseRoute('#lazuli-blocks')).toBe('lazuli-blocks');
    expect(parseRoute('#/lazuli-blocks')).toBe('lazuli-blocks');
    expect(parseRoute('#puga-salta')).toBe('puga-salta');
  });

  it('treats anything that is not a plain slug as the lobby', () => {
    expect(parseRoute('')).toBeNull();
    expect(parseRoute('#')).toBeNull();
    expect(parseRoute('#mode=dark')).toBeNull();
    expect(parseRoute('#../secret')).toBeNull();
    expect(parseRoute('#Lazuli')).toBeNull();
  });
});

describe('registry', () => {
  it('lists games with unique, URL-safe ids', () => {
    const ids = GAMES.map((game) => game.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(parseRoute(`#${id}`)).toBe(id);
  });

  it('describes every game for the lobby', () => {
    for (const game of GAMES) {
      expect(game.title.trim()).not.toBe('');
      expect(game.tagline.length).toBeGreaterThan(20);
      expect(game.themeColor.light).toMatch(/^#[0-9a-f]{6}$/i);
      expect(game.themeColor.dark).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('finds games by id', () => {
    expect(findGame('lazuli-blocks')?.title).toBe('Lazuli Blocks');
    expect(findGame('empilha')?.title).toBe('Empilha');
    expect(findGame('puga-salta')?.title).toBe('Puga Salta');
    expect(findGame('missing')).toBeNull();
    expect(findGame(null)).toBeNull();
  });
});
