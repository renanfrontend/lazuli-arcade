import { createElement, lazy } from 'react';
import type { GameDefinition } from '@shared/ui/arcade';
import { readRecord } from '@shared/application/records';
import { MiniThumbnail } from '@shared/ui/mini/MiniThumbnail';

export const cobrinhaCristais: GameDefinition = {
  id: 'cobrinha-cristais', title: 'Cobrinha de Cristais',
  tagline: 'Uma gema, mais um passo. Cresça, acelere e encontre seu caminho sem esbarrar!',
  themeColor: { light: '#059669', dark: '#064e3b' },
  Thumbnail: () => createElement(MiniThumbnail, { kind: 'snake' }),
  Screen: lazy(() => import('./ui/SnakeGame')),
  highlights: ({ openStore }) => { const record = readRecord(openStore('cobrinha-cristais:v1')); return record.games ? [`Recorde ${record.best}`] : []; },
};
