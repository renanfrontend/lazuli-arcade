const numberFormat = new Intl.NumberFormat('pt-BR');

export const formatNumber = (value: number): string => numberFormat.format(value);

export const countLabel = (value: number, singular: string, plural: string): string =>
  `${formatNumber(value)} ${value === 1 ? singular : plural}`;
