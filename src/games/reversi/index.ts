import { lazy } from 'react';
import type { GameDefinition } from '@shared/ui/arcade';
import { readRecord } from '@shared/application/records';
import { ReversiThumbnail } from '@shared/ui/strategy/StrategyThumbnail';
export const reversi: GameDefinition = {
  id: 'reversi', title: 'Reversi', tagline: 'Domine os cantos, antecipe jogadas e enfrente o computador em três níveis de estratégia.',
  themeColor: { light: '#101b2e', dark: '#101b2e' }, Thumbnail: ReversiThumbnail,
  Screen: lazy(() => import('./ui/ReversiGame')),
  highlights: ({ openStore }) => { const record = readRecord(openStore('reversi:v1')); return record.games ? [`Melhor placar: ${record.best} peças`, '3 níveis de CPU'] : ['Estratégia', '3 níveis de CPU']; },
};
