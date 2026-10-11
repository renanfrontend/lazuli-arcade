import type { Position } from '@shared/domain/grid';
import { cx } from '@shared/ui/cx';
import { boardFromLayout, stackFromCodes, withStack, type Board } from '../domain';
import boardStyles from './components/BoardView.module.css';
import { StackView } from './components/StackView';
import { HEADROOM, LAYER, SQUASH } from './geometry';
import theme from './styles/theme.module.css';
import tiles from './styles/tiles.module.css';
import styles from './EmpilhaThumbnail.module.css';

/** A 3 x 3 corner of a board mid-match, plus the race badge. */
const STACKS: readonly { readonly at: Position; readonly codes: string }[] = [
  { at: { col: 0, row: 0 }, codes: 'yyggg' },
  { at: { col: 2, row: 0 }, codes: 'rrllll' },
  { at: { col: 0, row: 1 }, codes: 'sss' },
  { at: { col: 1, row: 1 }, codes: 'bbsyyyyyyy' },
  { at: { col: 1, row: 2 }, codes: 'llgggg' },
  { at: { col: 2, row: 2 }, codes: 'rr' },
];

const BOARD: Board = STACKS.reduce(
  (board, { at, codes }) => withStack(board, at, stackFromCodes(codes) ?? []),
  boardFromLayout({ rows: ['###', '###', '###'], unlockAt: [] }),
);

export function EmpilhaThumbnail() {
  return (
    <div
      className={cx(theme.theme, styles.thumb)}
      style={{ '--hw': '21px', '--squash': SQUASH, '--layer': LAYER, '--headroom': HEADROOM }}
      aria-hidden="true"
    >
      <div className={boardStyles.board} style={{ '--cols': BOARD.cols, '--rows': BOARD.rows }}>
        {BOARD.cells.map((cell, index) => {
          const col = index % BOARD.cols;
          const row = Math.floor(index / BOARD.cols);
          return (
            <div key={index} className={boardStyles.cell} style={{ '--col': col, '--row': row, zIndex: col + row + 1 }}>
              <span className={tiles.tile} data-color="floor" />
              {cell.kind === 'open' && cell.stack.length > 0 && (
                <StackView tiles={cell.stack} className={boardStyles.stack} />
              )}
            </div>
          );
        })}
      </div>
      <div className={styles.race}>
        <span className={styles.you}>138</span>
        <span className={styles.vs}>VS</span>
        <span className={styles.rival}>142</span>
      </div>
    </div>
  );
}
