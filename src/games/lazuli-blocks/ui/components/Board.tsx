import { memo, useMemo, type KeyboardEvent, type PointerEvent, type Ref } from 'react';
import {
  colIndices,
  isInside,
  rowIndices,
  toIndex,
  type Board,
  type BoardCell,
  type GemKind,
  type LineSet,
  type Position,
} from '../../domain';
import { cx } from '@shared/ui/cx';
import styles from './Board.module.css';
import { GemTile } from './GemTile';

export interface BoardPreview {
  readonly gem: GemKind;
  readonly cells: readonly Position[];
  readonly valid: boolean;
  readonly lines: LineSet;
}

interface BoardViewProps {
  readonly board: Board;
  readonly preview: BoardPreview | null;
  readonly danger: boolean;
  readonly placing: boolean;
  readonly gridRef: Ref<HTMLDivElement>;
  readonly frameRef: Ref<HTMLDivElement>;
  readonly label: string;
  readonly describedBy: string;
  readonly onGridPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  readonly onGridKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}

interface CellFlags {
  readonly ghost: ReadonlyMap<number, boolean>;
  readonly glow: ReadonlySet<number>;
}

const NO_FLAGS: CellFlags = { ghost: new Map(), glow: new Set() };

export function BoardView({
  board,
  preview,
  danger,
  placing,
  gridRef,
  frameRef,
  label,
  describedBy,
  onGridPointerDown,
  onGridKeyDown,
}: BoardViewProps) {
  const flags = useMemo((): CellFlags => {
    if (!preview) return NO_FLAGS;
    const ghost = new Map<number, boolean>();
    for (const position of preview.cells) {
      if (isInside(board, position)) ghost.set(toIndex(board, position), preview.valid);
    }
    const glow = new Set<number>([
      ...preview.lines.rows.flatMap((row) => rowIndices(board, row)),
      ...preview.lines.cols.flatMap((col) => colIndices(board, col)),
    ]);
    return { ghost, glow };
  }, [board, preview]);

  return (
    <div className={styles.frame} ref={frameRef} data-danger={danger}>
      <div className={styles.inner}>
        <div
          ref={gridRef}
          className={cx(styles.grid, placing && styles.placing)}
          role="application"
          aria-roledescription="tabuleiro"
          aria-label={label}
          aria-describedby={describedBy}
          tabIndex={-1}
          onPointerDown={onGridPointerDown}
          onKeyDown={onGridKeyDown}
        >
          {board.cells.map((cell, index) => {
            const ghostValid = flags.ghost.get(index);
            return (
              <BoardCellView
                key={index}
                gem={cell}
                ghostGem={ghostValid !== undefined && cell === null && preview ? preview.gem : null}
                ghostValid={ghostValid ?? true}
                conflict={ghostValid === false && cell !== null}
                glow={flags.glow.has(index)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface BoardCellViewProps {
  readonly gem: BoardCell;
  readonly ghostGem: GemKind | null;
  readonly ghostValid: boolean;
  readonly conflict: boolean;
  readonly glow: boolean;
}

const BoardCellView = memo(function BoardCellView({ gem, ghostGem, ghostValid, conflict, glow }: BoardCellViewProps) {
  return (
    <div className={cx(styles.cell, conflict && styles.conflict)}>
      {gem ? (
        <GemTile key="gem" gem={gem} glow={glow} animateIn />
      ) : ghostGem ? (
        <GemTile key="ghost" gem={ghostGem} variant={ghostValid ? 'ghost' : 'invalid'} glow={glow} />
      ) : null}
    </div>
  );
});
