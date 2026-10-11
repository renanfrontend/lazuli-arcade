import { lazy } from 'react';
import type { GameDefinition } from '@shared/ui/arcade';
import { countLabel, formatNumber } from '@shared/ui/format';
import { LAZULI_STORE, loadProfile } from './application/profile';
import { LazuliThumbnail } from './ui/LazuliThumbnail';

export const lazuliBlocks: GameDefinition = {
  id: 'lazuli-blocks',
  title: 'Lazuli Blocks',
  tagline: 'Encaixe peças no tabuleiro, complete linhas e colunas e transforme gemas em moedas.',
  themeColor: { light: '#3a9fe9', dark: '#0c2350' },
  Thumbnail: LazuliThumbnail,
  Screen: lazy(() => import('./ui/LazuliGame')),
  highlights: ({ openStore }) => {
    const { best, coins } = loadProfile(openStore(LAZULI_STORE));
    if (best === 0 && coins === 0) return [];
    return [`Recorde ${formatNumber(best)}`, countLabel(coins, 'moeda', 'moedas')];
  },
};
