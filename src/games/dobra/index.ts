import { lazy } from 'react';
import type { GameDefinition } from '@shared/ui/arcade';
import { formatNumber } from '@shared/ui/format';
import { DOBRA_STORE, loadBest } from './application/save';
import { DobraThumbnail } from './ui/DobraThumbnail';

export const dobra: GameDefinition = {
  id: 'dobra',
  title: 'Dobra',
  tagline: 'Deslize o tabuleiro, junte bichinhos iguais e chegue ao 2048 com a Coruja de ouro.',
  themeColor: { light: '#54c486', dark: '#0c1f15' },
  Thumbnail: DobraThumbnail,
  Screen: lazy(() => import('./ui/DobraGame')),
  highlights: ({ openStore }) => {
    const best = loadBest(openStore(DOBRA_STORE));
    return best === 0 ? [] : [`Recorde ${formatNumber(best)}`];
  },
};
