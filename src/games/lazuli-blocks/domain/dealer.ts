import { fillRatio, type Board } from './board';
import type { GemKind } from './gem';
import { fitsAnywhere } from './placement';
import { nextInt, pickOne, pickWeighted, type Seed, type WeightedEntry } from '@shared/domain/rng';
import { adaptiveWeight, type Shape } from './shapes';

export interface TrayPiece {
  readonly id: number;
  readonly shape: Shape;
  readonly gem: GemKind;
}

export type TraySlot = TrayPiece | null;

export interface DealContext {
  readonly board: Board;
  readonly catalog: readonly Shape[];
  readonly palette: readonly GemKind[];
  readonly size: number;
  readonly nextPieceId: number;
  /** Difficulty ramp in 0..1 (see `difficultyLevel`). */
  readonly level?: number;
}

export interface Deal {
  readonly tray: readonly TrayPiece[];
  readonly seed: Seed;
  readonly nextPieceId: number;
}

const MAX_ATTEMPTS = 12;

export const anyPieceFits = (board: Board, tray: readonly TraySlot[]): boolean =>
  tray.some((piece) => piece !== null && fitsAnywhere(board, piece.shape));

/**
 * Deals a fresh tray. Weights adapt to how full the board is, and the deal is
 * fair: whenever any shape in the catalog still fits, at least one dealt piece
 * fits too, so a game never ends right after a refill.
 */
export const dealTray = (seed: Seed, context: DealContext): Deal => {
  const fill = fillRatio(context.board);
  const weighted: WeightedEntry<Shape>[] = context.catalog.map((shape) => [
    shape,
    adaptiveWeight(shape, fill, context.level ?? 0),
  ]);
  const fits = (shape: Shape): boolean => fitsAnywhere(context.board, shape);

  let current = seed;
  let shapes: Shape[] = [];
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    shapes = [];
    for (let slot = 0; slot < context.size; slot += 1) {
      const roll = pickWeighted(current, weighted);
      current = roll.seed;
      shapes.push(roll.value);
    }
    if (shapes.some(fits)) break;
  }

  if (!shapes.some(fits)) {
    const fitting = weighted.filter(([shape]) => fits(shape));
    if (fitting.length > 0) {
      const rescue = pickWeighted(current, fitting);
      const slot = nextInt(rescue.seed, context.size);
      current = slot.seed;
      shapes[slot.value] = rescue.value;
    }
  }

  const tray = shapes.map((shape, index): TrayPiece => {
    const gem = pickOne(current, context.palette);
    current = gem.seed;
    return { id: context.nextPieceId + index, shape, gem: gem.value };
  });

  return { tray, seed: current, nextPieceId: context.nextPieceId + tray.length };
};
