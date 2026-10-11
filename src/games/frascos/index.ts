import { lazy } from 'react';
import type { GameDefinition } from '@shared/ui/arcade';
import { FRASCOS_STORE, loadLevel } from './application/save';
import { FrascosThumbnail } from './ui/FrascosThumbnail';

export const frascos: GameDefinition = {
  id: 'frascos',
  title: 'Frascos',
  tagline: 'Despeje as cores de frasco em frasco até cada um ficar de uma cor só. Cada nível traz uma cor a mais.',
  themeColor: { light: '#5fb3e6', dark: '#0b1b28' },
  Thumbnail: FrascosThumbnail,
  Screen: lazy(() => import('./ui/FrascosGame')),
  highlights: ({ openStore }) => {
    const level = loadLevel(openStore(FRASCOS_STORE));
    return level > 1 ? [`Nível ${level}`] : [];
  },
};
