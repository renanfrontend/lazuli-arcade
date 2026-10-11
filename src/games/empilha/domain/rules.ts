import type { WeightedEntry } from '@shared/domain/rng';
import type { Layout } from './board';
import { TILE_COLORS, type TileColor } from './tiles';

/** Shape of the stacks dealt to the tray. */
export interface StackRecipe {
  /** Tiles per stack, weighted. */
  readonly sizes: readonly WeightedEntry<number>[];
  /** Color runs per stack, weighted. */
  readonly runs: readonly WeightedEntry<number>[];
  /** Chance that a new stack's top color already sits on top of a board stack. */
  readonly matchBoardTop: number;
}

/** How a landed stack settles and scores. */
export interface SettleRules {
  /** Tiles of one color needed on top of a stack to clear it. */
  readonly clearAt: number;
  /** Points per tile that hops onto a matching stack. */
  readonly mergePoints: number;
}


export interface Rules {
  readonly layout: Layout;
  readonly settle: SettleRules;
  readonly recipe: StackRecipe;
  readonly traySize: number;
  /** Stacks already on the board when a match starts. */
  readonly initialStacks: number;
  readonly target: (level: number) => number;
  readonly palette: (level: number) => readonly TileColor[];
}

/**
 * 5 x 5 grid drawn as a diamond, shared by both players. The centre opens once the two scores
 * together reach 100. Tuned by simulation (see the duel tests): the strongest rival beats the
 * gentlest nine times in ten, and a good share of matches is settled by who is ahead when the
 * board runs out of room.
 */
export const DEFAULT_LAYOUT: Layout = {
  rows: ['#####', '#####', '##L##', '#####', '#####'],
  unlockAt: [100],
};

const clampLevel = (level: number) => Math.max(1, Math.floor(level));

export const DEFAULT_RULES: Rules = {
  layout: DEFAULT_LAYOUT,
  settle: { clearAt: 10, mergePoints: 1 },
  recipe: {
    sizes: [
      [2, 2],
      [3, 4],
      [4, 4],
      [5, 3],
      [6, 2],
    ],
    runs: [
      [1, 4],
      [2, 5],
      [3, 2],
    ],
    matchBoardTop: 0.55,
  },
  traySize: 3,
  initialStacks: 4,
  target: () => 250,
  palette: (level) => (clampLevel(level) >= 3 ? TILE_COLORS : TILE_COLORS.slice(0, 5)),
};
