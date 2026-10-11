import type { ReactNode } from 'react';

/** A color plus a shape for each segment, so flasks can be told apart without relying on color. */
export interface Swatch {
  readonly name: string;
  readonly color: string;
  readonly glyph: ReactNode;
}

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 3.2, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;

export const SWATCHES: readonly Swatch[] = [
  { name: 'vermelho', color: '#f2554a', glyph: <circle cx="12" cy="12" r="5" {...stroke} /> },
  { name: 'laranja', color: '#ff9a2e', glyph: <rect x="7" y="7" width="10" height="10" rx="1.5" {...stroke} /> },
  { name: 'amarelo', color: '#ffd23f', glyph: <path d="M12 6 18 17H6Z" {...stroke} /> },
  { name: 'verde', color: '#3fc66b', glyph: <path d="M12 5.5 13.9 10l4.6.4-3.5 3 1.1 4.6L12 15.600 7.900 18l1.100-4.600-3.500-3 4.600-.4Z" {...stroke} /> },
  { name: 'azul-claro', color: '#4cc9f0', glyph: <path d="M12 5 19 12 12 19 5 12Z" {...stroke} /> },
  { name: 'azul', color: '#3a6ff0', glyph: <path d="M12 6v12M6 12h12" {...stroke} /> },
  { name: 'roxo', color: '#9b5de5', glyph: <path d="M15.500 6.500A6.500 6.500 0 1 0 15.500 17.500 5 5 0 0 1 15.500 6.500Z" {...stroke} /> },
  { name: 'rosa', color: '#f06ba8', glyph: <path d="M12 18C5 13 6 7.500 9.500 7.500 11 7.500 12 9 12 9S13 7.500 14.500 7.500C18 7.500 19 13 12 18Z" {...stroke} /> },
];
