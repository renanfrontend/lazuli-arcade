/**
 * Pure, seedable PRNG (mulberry32). Every call returns the next seed instead of
 * mutating hidden state, so the reducer stays deterministic and replayable.
 */
export type Seed = number;

export interface Rolled<TValue> {
  readonly value: TValue;
  readonly seed: Seed;
}

export type WeightedEntry<TItem> = readonly [item: TItem, weight: number];

export const toSeed = (value: number): Seed => (Number.isFinite(value) ? Math.trunc(value) >>> 0 : 0);

export const nextFloat = (seed: Seed): Rolled<number> => {
  const state = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, seed: state >>> 0 };
};

export const nextInt = (seed: Seed, maxExclusive: number): Rolled<number> => {
  if (!Number.isInteger(maxExclusive) || maxExclusive < 1) {
    throw new RangeError(`nextInt needs a positive integer bound, received ${maxExclusive}`);
  }
  const roll = nextFloat(seed);
  return { value: Math.floor(roll.value * maxExclusive), seed: roll.seed };
};

export const pickOne = <TItem>(seed: Seed, items: readonly TItem[]): Rolled<TItem> => {
  const roll = nextInt(seed, items.length);
  const value = items[roll.value];
  if (value === undefined) throw new RangeError('pickOne needs a non-empty list');
  return { value, seed: roll.seed };
};

export const pickWeighted = <TItem>(seed: Seed, entries: readonly WeightedEntry<TItem>[]): Rolled<TItem> => {
  const positive = entries.filter(([, weight]) => weight > 0);
  const total = positive.reduce((sum, [, weight]) => sum + weight, 0);
  const fallback = positive.at(-1);
  if (fallback === undefined || !(total > 0)) {
    throw new RangeError('pickWeighted needs at least one positive weight');
  }

  const roll = nextFloat(seed);
  let threshold = roll.value * total;
  for (const [item, weight] of positive) {
    threshold -= weight;
    if (threshold < 0) return { value: item, seed: roll.seed };
  }
  // Floating point drift can leave a tiny remainder: settle on the last entry.
  return { value: fallback[0], seed: roll.seed };
};
