import type { GameDefinition } from '@shared/ui/arcade';
import { empilha } from '../games/empilha';
import { lazuliBlocks } from '../games/lazuli-blocks';
import { pugaSalta } from '../games/puga-salta';

export const GAMES: readonly GameDefinition[] = [lazuliBlocks, empilha, pugaSalta];

export const findGame = (id: string | null): GameDefinition | null =>
  id === null ? null : (GAMES.find((game) => game.id === id) ?? null);
