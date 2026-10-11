import { memo, type KeyboardEvent, type PointerEvent, type Ref } from 'react';
import { cx } from '@shared/ui/cx';
import { samePosition, toPosition, type Position } from '@shared/domain/grid';
import type { Board, Cell } from '../../domain';
import tiles from '../styles/tiles.module.css';
import styles from './BoardView.module.css';
import { StackView } from './StackView';

interface BoardViewProps {
  readonly board: Board;
  /** Free cell under a dragged stack. */
  readonly target: Position | null;
  /** Keyboard selection cursor. */
  readonly cursor: Position | null;
  /** A stack was picked by tap: show every cell it can go to. */
  readonly highlightFree: boolean;
  readonly boardRef: Ref<HTMLDivElement>;
  readonly label: string;
  readonly describedBy: string;
  readonly interactive: boolean;
  readonly onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}

export function BoardView({
  board,
  target,
  cursor,
  highlightFree,
  boardRef,
  label,
  describedBy,
  interactive,
  onPointerDown,
  onKeyDown,
}: BoardViewProps) {
  return (
    <div
      ref={boardRef}
      className={cx(styles.board, interactive && styles.interactive)}
      style={{ '--cols': board.cols, '--rows': board.rows }}
      role="application"
      aria-roledescription="tabuleiro"
      aria-label={label}
      aria-describedby={describedBy}
      tabIndex={-1}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
    >
      {board.cells.map((cell, index) => {
        if (cell.kind === 'void') return null;
        const position = toPosition(board, index);
        return (
          <BoardCell
            key={index}
            cell={cell}
            col={position.col}
            row={position.row}
            isTarget={target !== null && samePosition(target, position)}
            isCursor={cursor !== null && samePosition(cursor, position)}
            isAvailable={highlightFree && cell.kind === 'open' && cell.stack.length === 0}
          />
        );
      })}
    </div>
  );
}

interface BoardCellProps {
  readonly cell: Exclude<Cell, { kind: 'void' }>;
  readonly col: number;
  readonly row: number;
  readonly isTarget: boolean;
  readonly isCursor: boolean;
  readonly isAvailable: boolean;
}

const BoardCell = memo(function BoardCell({ cell, col, row, isTarget, isCursor, isAvailable }: BoardCellProps) {
  const locked = cell.kind === 'locked';
  return (
    <div
      className={styles.cell}
      style={{ '--col': col, '--row': row, zIndex: col + row + 1 }}
      data-target={isTarget}
      data-cursor={isCursor}
      data-available={isAvailable}
      data-locked={locked}
    >
      <span className={cx(tiles.tile, styles.floor)} data-color={locked ? 'locked' : 'floor'} />
      {cell.kind === 'locked' && (
        <span className={styles.lock}>
          <LockIcon />
          <span className={styles.lockLabel}>{cell.unlockAt}</span>
        </span>
      )}
      {cell.kind === 'open' && cell.stack.length > 0 && <StackView tiles={cell.stack} className={styles.stack} />}
    </div>
  );
});

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.lockIcon} aria-hidden="true" focusable="false">
      <path d="M7.5 10.5V8a4.5 4.5 0 0 1 9 0v2.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="4.8" y="10" width="14.4" height="10.6" rx="3" fill="currentColor" />
      <circle cx="12" cy="15.3" r="1.7" fill="var(--e-lock-face)" />
    </svg>
  );
}
