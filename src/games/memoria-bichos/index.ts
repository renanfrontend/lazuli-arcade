import { createElement, lazy } from 'react';
import type { GameDefinition } from '@shared/ui/arcade';
import { readRecord } from '@shared/application/records';
import { MiniThumbnail } from '@shared/ui/mini/MiniThumbnail';

export const memoriaBichos: GameDefinition = {
  id: 'memoria-bichos', title: 'Memória dos Bichos',
  tagline: 'Puga, Tatá e os amigos viraram cartas. Encontre os pares e desafie sua memória!',
  themeColor: { light: '#8b5cf6', dark: '#4c1d95' },
  Thumbnail: () => createElement(MiniThumbnail, { kind: 'memory' }),
  Screen: lazy(() => import('./ui/MemoryGame')),
  highlights: ({ openStore }) => { const record = readRecord(openStore('memoria-bichos:v1')); return record.games ? [`Recorde ${record.best} pts`] : []; },
};
