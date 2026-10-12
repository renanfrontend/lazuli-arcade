import type { GameDefinition } from '@shared/ui/arcade';

export type Category = 'terror' | 'puzzle' | 'estrategia' | 'memoria' | 'acao';

/** Lobby grouping. Lives here (not in each game) so the lobby can be reorganised in one place. */
export const CATEGORY_OF: Readonly<Record<string, Category>> = {
  'trilha-noturna': 'terror',
  'lazuli-blocks': 'puzzle',
  '2048': 'puzzle',
  dobra: 'puzzle',
  frascos: 'puzzle',
  'quebra-gemas': 'puzzle',
  reversi: 'estrategia',
  empilha: 'estrategia',
  memoria: 'memoria',
  'memoria-bichos': 'memoria',
  'cobrinha-cristais': 'acao',
  'puga-salta': 'acao',
};

export const CATEGORIES: readonly { readonly id: Category; readonly label: string; readonly blurb: string }[] = [
  { id: 'terror', label: 'Terror', blurb: 'Primeira pessoa e tensão' },
  { id: 'puzzle', label: 'Puzzle', blurb: 'Encaixe, junte e resolva' },
  { id: 'estrategia', label: 'Estratégia', blurb: 'Duelos contra o computador' },
  { id: 'memoria', label: 'Memória', blurb: 'Pares, bichos e atenção' },
  { id: 'acao', label: 'Ação', blurb: 'Reflexo e ritmo' },
];

export const categoryOf = (game: GameDefinition): Category => CATEGORY_OF[game.id] ?? 'puzzle';
