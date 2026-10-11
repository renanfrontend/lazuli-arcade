import { createElement, lazy } from 'react';
import type { GameDefinition } from '@shared/ui/arcade';
import { readRecord } from '@shared/application/records';
import { MiniThumbnail } from '@shared/ui/mini/MiniThumbnail';

export const quebraGemas: GameDefinition = {
  id: 'quebra-gemas', title: 'Quebra-Gemas',
  tagline: 'Rebata a bolinha, estoure as gemas e vença três fases com sua melhor pontuação!',
  themeColor: { light: '#0284c7', dark: '#0c4a6e' },
  Thumbnail: () => createElement(MiniThumbnail, { kind: 'breakout' }),
  Screen: lazy(() => import('./ui/BreakoutGame')),
  highlights: ({ openStore }) => { const record = readRecord(openStore('quebra-gemas:v1')); return record.games ? [`Recorde ${record.best}`] : []; },
};
