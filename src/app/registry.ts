import type { GameDefinition } from '@shared/ui/arcade';
import { empilha } from '../games/empilha';
import { lazuliBlocks } from '../games/lazuli-blocks';
import { pugaSalta } from '../games/puga-salta';
import { cobrinhaCristais } from '../games/cobrinha-cristais';
import { memoriaBichos } from '../games/memoria-bichos';
import { quebraGemas } from '../games/quebra-gemas';

export const GAMES: readonly GameDefinition[] = [lazuliBlocks, empilha, pugaSalta, cobrinhaCristais, memoriaBichos, quebraGemas];

export const findGame = (id: string | null): GameDefinition | null =>
  id === null ? null : (GAMES.find((game) => game.id === id) ?? null);
