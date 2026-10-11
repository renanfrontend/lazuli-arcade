export const GEM_KINDS = ['sapphire', 'ruby', 'emerald', 'amethyst', 'topaz'] as const;

export type GemKind = (typeof GEM_KINDS)[number];

export const isGemKind = (value: unknown): value is GemKind =>
  typeof value === 'string' && (GEM_KINDS as readonly string[]).includes(value);
