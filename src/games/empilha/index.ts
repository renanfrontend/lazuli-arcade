import { lazy } from 'react';
import type { GameDefinition } from '@shared/ui/arcade';
import { countLabel } from '@shared/ui/format';
import { EMPILHA_STORE, loadStats } from './application/stats';
import { EmpilhaThumbnail } from './ui/EmpilhaThumbnail';

export const empilha: GameDefinition = {
  id: 'empilha',
  title: 'Empilha',
  tagline: 'Duelo de pilhas: junte símbolos iguais, limpe de 10 em 10 e chegue a 250 antes do oponente.',
  themeColor: { light: '#f2f5fa', dark: '#0d1422' },
  Thumbnail: EmpilhaThumbnail,
  Screen: lazy(() => import('./ui/EmpilhaGame')),
  highlights: ({ openStore }) => {
    const stats = loadStats(openStore(EMPILHA_STORE));
    if (stats.wins + stats.losses === 0) return [];
    return [countLabel(stats.beaten.length, 'rival vencido', 'rivais vencidos'), countLabel(stats.wins, 'vitória', 'vitórias')];
  },
};
