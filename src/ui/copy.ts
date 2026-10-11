import type { PlacedEvent, Shape } from '../domain';

const numberFormat = new Intl.NumberFormat('pt-BR');

export const formatNumber = (value: number): string => numberFormat.format(value);

export const countLabel = (value: number, singular: string, plural: string): string =>
  `${formatNumber(value)} ${value === 1 ? singular : plural}`;

export const describeShape = (shape: Shape): string => {
  const blocks = shape.cells.length;
  switch (shape.family) {
    case 'dot':
      return 'bloco único';
    case 'line':
      return `linha ${shape.width > 1 ? 'horizontal' : 'vertical'} de ${blocks}`;
    case 'square':
      return `quadrado ${shape.width} por ${shape.height}`;
    case 'rect':
      return `retângulo ${shape.width} por ${shape.height}`;
    case 'corner':
      return 'cantoneira de 3 blocos';
    case 'tee':
      return 'T de 4 blocos';
    case 'ell':
      return 'L de 4 blocos';
    case 'skew':
      return 'zigue-zague de 4 blocos';
    case 'bigCorner':
      return 'canto grande de 5 blocos';
  }
};

export const praiseFor = (lines: number, perfectClear: boolean): string => {
  if (perfectClear) return 'Tabuleiro limpo!';
  if (lines >= 4) return 'Lendário!';
  if (lines === 3) return 'Incrível!';
  if (lines === 2) return 'Ótimo!';
  return 'Boa!';
};

export const placedAnnouncement = (event: PlacedEvent): string => {
  const parts: string[] = [];
  const lines = event.lines.rows.length + event.lines.cols.length;
  if (lines === 0) {
    parts.push('Peça colocada.');
  } else {
    parts.push(`${praiseFor(lines, event.perfectClear)} ${countLabel(lines, 'linha completa', 'linhas completas')}.`);
    parts.push(`Mais ${countLabel(event.coins, 'moeda', 'moedas')} e ${countLabel(event.points, 'ponto', 'pontos')}.`);
    if (event.streak >= 2) parts.push(`Combo ${event.streak}.`);
  }
  if (event.dealt && !event.gameOver) parts.push('Novas peças na bandeja.');
  if (event.gameOver) parts.push('Fim de jogo: nenhuma peça cabe no tabuleiro.');
  return parts.join(' ');
};
