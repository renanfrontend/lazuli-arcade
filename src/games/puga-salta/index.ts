import { lazy } from 'react';
import type { GameDefinition } from '@shared/ui/arcade';
import { countLabel, formatNumber } from '@shared/ui/format';
import { PUGA_STORE, loadPugaStats } from './application/stats';
import { PugaThumbnail } from './ui/PugaThumbnail';

export const pugaSalta: GameDefinition = {
  id: 'puga-salta',
  title: 'Puga Salta',
  tagline: 'Pule entre plataformas nas alturas, colete ossinhos dourados e desvie dos perigos com o Puga!',
  themeColor: { light: '#38bdf8', dark: '#0c4a6e' },
  Thumbnail: PugaThumbnail,
  Screen: lazy(() => import('./ui/PugaSaltaGame')),
  highlights: ({ openStore }) => {
    const stats = loadPugaStats(openStore(PUGA_STORE));
    if (stats.bestHeight === 0 && stats.totalBones === 0) return [];
    return [`Recorde ${formatNumber(stats.bestHeight)}m`, countLabel(stats.totalBones, 'osso', 'ossos')];
  },
};
