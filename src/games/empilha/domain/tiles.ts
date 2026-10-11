/** Tile colors. Each one also has its own symbol in the UI, so color is never the only cue. */
export const TILE_COLORS = ['sky', 'grape', 'sun', 'rose', 'leaf', 'royal'] as const;

export type TileColor = (typeof TILE_COLORS)[number];

export const isTileColor = (value: unknown): value is TileColor =>
  typeof value === 'string' && (TILE_COLORS as readonly string[]).includes(value);

/** One-letter codes for compact save files. */
export const TILE_CODES: Readonly<Record<TileColor, string>> = {
  sky: 's',
  grape: 'g',
  sun: 'y',
  rose: 'r',
  leaf: 'l',
  royal: 'b',
};

const COLOR_BY_CODE = new Map<string, TileColor>(TILE_COLORS.map((color) => [TILE_CODES[color], color]));

export const tileFromCode = (code: string): TileColor | undefined => COLOR_BY_CODE.get(code);
