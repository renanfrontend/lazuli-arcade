import { lazy } from 'react';
import type { GameDefinition } from '@shared/ui/arcade';
import { readRecord } from '@shared/application/records';
import { GridThumbnail } from '@shared/ui/strategy/StrategyThumbnail';
export const grid2048: GameDefinition = {
  id: '2048', title: '2048', tagline: 'Combine números, preserve espaço e construa seu caminho até 2048 — ou muito além.',
  themeColor: { light: '#101b2e', dark: '#101b2e' }, Thumbnail: GridThumbnail,
  Screen: lazy(() => import('./ui/GridGame')),
  highlights: ({ openStore }) => { const record = readRecord(openStore('2048:v1')); return record.best ? [`Recorde ${record.best}`, 'Partida salva'] : ['Lógica', 'Desfazer jogada']; },
};
