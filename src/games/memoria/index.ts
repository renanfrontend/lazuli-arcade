import { lazy } from 'react';
import type { GameDefinition } from '@shared/ui/arcade';
import { loadBest, MEMORIA_STORE } from './application/save';
import { MemoriaThumbnail } from './ui/MemoriaThumbnail';

export const memoria: GameDefinition = {
  id: 'memoria',
  title: 'Memória',
  tagline: 'Vire as cartas, ache os pares de bichinhos e faça o mínimo de jogadas.',
  themeColor: { light: '#ffb84d', dark: '#1d1608' },
  Thumbnail: MemoriaThumbnail,
  Screen: lazy(() => import('./ui/MemoriaGame')),
  highlights: ({ openStore }) => {
    const best = loadBest(openStore(MEMORIA_STORE));
    return best === null ? [] : [`Melhor: ${best} jogadas`];
  },
};
