import type { CastId } from '@shared/cast/cast';
import { RIVALS } from '../domain';
import type { Stats } from './stats';

/** Default rival for a fresh match: the easiest one not yet beaten, or the hardest once all are. */
export const nextOpponent = (stats: Stats): CastId => {
  const pending = RIVALS.find((rival) => !stats.beaten.includes(rival.id));
  return (pending ?? RIVALS[RIVALS.length - 1])?.id ?? 'tata';
};
