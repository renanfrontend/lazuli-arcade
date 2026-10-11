import { useMemo, type MouseEvent, type PointerEvent } from 'react';
import { fitsAnywhere, type Board, type TrayPiece, type TraySlot } from '../../domain';
import { describeShape } from '../copy';
import { CoinIcon, ShuffleIcon } from './icons';
import { PieceGems } from './PieceGems';
import styles from './Tray.module.css';

export interface PieceHandlers {
  readonly onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  readonly onLostPointerCapture: (event: PointerEvent<HTMLElement>) => void;
  readonly onClick: (event: MouseEvent<HTMLElement>) => void;
}

interface TrayProps {
  readonly tray: readonly TraySlot[];
  readonly board: Board;
  readonly playing: boolean;
  readonly liftedId: number | null;
  readonly selectedId: number | null;
  readonly rerollPrice: number;
  readonly canReroll: boolean;
  readonly hint: string | null;
  readonly helpId: string;
  readonly bind: (piece: TrayPiece) => PieceHandlers;
  readonly onReroll: () => void;
}

export function Tray({
  tray,
  board,
  playing,
  liftedId,
  selectedId,
  rerollPrice,
  canReroll,
  hint,
  helpId,
  bind,
  onReroll,
}: TrayProps) {
  const fits = useMemo(
    () => new Map(tray.flatMap((piece) => (piece ? [[piece.id, fitsAnywhere(board, piece.shape)] as const] : []))),
    [board, tray],
  );

  return (
    <section className={styles.tray} aria-label="Bandeja de peças">
      {hint && (
        <p className={styles.hint} role="status">
          {hint}
        </p>
      )}
      {tray.map((piece, index) => (
        <div className={styles.slot} key={index}>
          {piece ? (
            <button
              key={piece.id}
              type="button"
              className={styles.piece}
              style={{ '--i': index }}
              data-fits={fits.get(piece.id) ?? false}
              data-lifted={piece.id === liftedId}
              aria-pressed={piece.id === selectedId}
              aria-disabled={!playing}
              aria-describedby={helpId}
              aria-label={`Peça ${index + 1}: ${describeShape(piece.shape)}${fits.get(piece.id) ? '' : ', não cabe no tabuleiro'}`}
              {...bind(piece)}
            >
              <PieceGems shape={piece.shape} gem={piece.gem} />
            </button>
          ) : (
            <span className={styles.empty} aria-hidden="true" />
          )}
        </div>
      ))}
      <button
        type="button"
        className={styles.reroll}
        onClick={onReroll}
        disabled={!canReroll}
        aria-label={`Trocar peças por ${rerollPrice} moedas`}
        title={canReroll ? 'Trocar peças' : `Junte ${rerollPrice} moedas para trocar as peças`}
      >
        <ShuffleIcon className={styles.rerollIcon} />
        <span className={styles.rerollPrice} aria-hidden="true">
          <CoinIcon className={styles.rerollCoin} />
          {rerollPrice}
        </span>
      </button>
    </section>
  );
}

