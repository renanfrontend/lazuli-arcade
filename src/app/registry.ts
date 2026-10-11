import type { GameDefinition } from '@shared/ui/arcade';
import { empilha } from '../games/empilha';
import { lazuliBlocks } from '../games/lazuli-blocks';
import { pugaSalta } from '../games/puga-salta';

/** Every game in the arcade, in lobby order. To add one, create src/games/<id>/index.ts and list it here. */
export const GAMES: readonly GameDefinition[] = [lazuliBlocks, empilha, pugaSalta];

export const findGame = (id: string | null): GameDefinition | null =>
  id === null ? null : (GAMES.find((game) => game.id === id) ?? null);
