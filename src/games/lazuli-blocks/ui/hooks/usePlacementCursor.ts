import { useCallback, useState } from 'react';
import { clampOrigin, validOrigins, type Board, type Position, type Shape, type TrayPiece, type TraySlot } from '../../domain';

export type SelectSource = 'pointer' | 'keyboard';

export interface PlacementCursor {
  readonly piece: TrayPiece;
  readonly origin: Position;
  readonly source: SelectSource;
}

/** Closest valid spot to the board centre, so a selected piece starts somewhere useful. */
const startingOrigin = (board: Board, shape: Shape): Position => {
  const centre = { col: (board.cols - shape.width) / 2, row: (board.rows - shape.height) / 2 };
  let best: Position | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const origin of validOrigins(board, shape)) {
    const distance = Math.hypot(origin.col - centre.col, origin.row - centre.row);
    if (distance < bestDistance) {
      best = origin;
      bestDistance = distance;
    }
  }
  return best ?? clampOrigin(board, shape, { col: Math.round(centre.col), row: Math.round(centre.row) });
};

/** Select-then-place mode for keyboard, switch access and tap-tap play. */
export const usePlacementCursor = (board: Board, tray: readonly TraySlot[]) => {
  const [cursor, setCursor] = useState<PlacementCursor | null>(null);
  const active = cursor !== null && tray.some((slot) => slot?.id === cursor.piece.id) ? cursor : null;

  const select = useCallback(
    (piece: TrayPiece, source: SelectSource) => {
      setCursor((current) =>
        current?.piece.id === piece.id ? null : { piece, source, origin: startingOrigin(board, piece.shape) },
      );
    },
    [board],
  );

  const moveTo = useCallback(
    (origin: Position) => {
      setCursor((current) => current && { ...current, origin: clampOrigin(board, current.piece.shape, origin) });
    },
    [board],
  );

  const clear = useCallback(() => {
    setCursor(null);
  }, []);

  return { cursor: active, select, moveTo, clear };
};
