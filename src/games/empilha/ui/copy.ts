import { countLabel } from '@shared/ui/format';
import { runsFromTop, type EndReason, type Stack, type TileColor } from '../domain';

export { countLabel, formatNumber } from '@shared/ui/format';

/**
 * Tiles are named by their symbol ("3 estrelas"), the cue that does not depend on telling colors
 * apart, with the color as a secondary hint.
 */
const TILE_NAMES: Readonly<Record<TileColor, { readonly one: string; readonly many: string; readonly color: string }>> = {
  sky: { one: 'asterisco', many: 'asteriscos', color: 'azul-claro' },
  grape: { one: 'hexágono', many: 'hexágonos', color: 'roxo' },
  sun: { one: 'estrela', many: 'estrelas', color: 'amarelo' },
  rose: { one: 'anel', many: 'anéis', color: 'rosa' },
  leaf: { one: 'trevo', many: 'trevos', color: 'verde' },
  royal: { one: 'triângulo', many: 'triângulos', color: 'azul' },
};

export const tileCount = (color: TileColor, count: number): string =>
  `${count} ${count === 1 ? TILE_NAMES[color].one : TILE_NAMES[color].many}`;

export const tileName = (color: TileColor): string => TILE_NAMES[color].many;

export const tileColorName = (color: TileColor): string => TILE_NAMES[color].color;

/** "3 estrelas sobre 2 hexágonos" — top run first, as the player sees it. */
export const describeStack = (stack: Stack): string => {
  const runs = runsFromTop(stack);
  if (runs.length === 0) return 'vazia';
  return runs.map((run) => tileCount(run.color, run.count)).join(' sobre ');
};

export const RESULT_COPY: Readonly<Record<EndReason, { readonly title: string; readonly text: string }>> = {
  target: { title: 'Vitória!', text: 'Você chegou à meta antes do rival.' },
  lead: { title: 'Vitória!', text: 'O tabuleiro encheu e você estava na frente.' },
  'opponent-target': { title: 'Derrota', text: 'O rival chegou à meta primeiro.' },
  'opponent-lead': { title: 'Derrota', text: 'O tabuleiro encheu com o rival na frente.' },
};

export const pointsLabel = (points: number): string => countLabel(points, 'ponto', 'pontos');
