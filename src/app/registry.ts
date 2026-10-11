import type { GameDefinition } from '@shared/ui/arcade';
import { empilha } from '../games/empilha';
import { lazuliBlocks } from '../games/lazuli-blocks';
import { pugaSalta } from '../games/puga-salta';
import { cobrinhaCristais } from '../games/cobrinha-cristais';
import { memoriaBichos } from '../games/memoria-bichos';
import { quebraGemas } from '../games/quebra-gemas';

import { reversi } from '../games/reversi';
import { grid2048 } from '../games/2048';

import { trilhaNoturna } from '../games/trilha-noturna';

export const GAMES: readonly GameDefinition[] = [trilhaNoturna, reversi, grid2048, lazuliBlocks, empilha, quebraGemas, cobrinhaCristais, pugaSalta, memoriaBichos];

export const findGame = (id: string | null): GameDefinition | null =>
  id === null ? null : (GAMES.find((game) => game.id === id) ?? null);
