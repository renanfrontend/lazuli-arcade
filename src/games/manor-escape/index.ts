import { lazy } from 'react';
import type { GameDefinition } from '@shared/ui/arcade';
import { ManorThumbnail } from './ui/ManorThumbnail';

export const manorEscape: GameDefinition = {
  id: 'manor-escape',
  title: 'Manor Escape',
  tagline: 'Escape room vitoriano: 6 cômodos, 11 enigmas (Da Vinci, anagramas, criptex) e 45 minutos para fugir da mansão.',
  themeColor: { light: '#1a1012', dark: '#120b0c' },
  Thumbnail: ManorThumbnail,
  Screen: lazy(() => import('./ui/ManorEscapeGame')),
  highlights: () => ['Escape room', '11 enigmas'],
};
