import { useRef } from 'react';
import { formatNumber } from '../copy';
import { Dialog } from '@shared/ui/Dialog';
import styles from '@shared/ui/Dialog.module.css';
import { CoinIcon, ShuffleIcon } from '@shared/ui/icons';
import { Mascot } from './Mascot';

interface GameOverDialogProps {
  readonly open: boolean;
  readonly score: number;
  readonly best: number;
  readonly runCoins: number;
  readonly rerollPrice: number;
  readonly canReroll: boolean;
  readonly onReroll: () => void;
  readonly onRestart: () => void;
  readonly onDismiss: () => void;
}

export function GameOverDialog({
  open,
  score,
  best,
  runCoins,
  rerollPrice,
  canReroll,
  onReroll,
  onRestart,
  onDismiss,
}: GameOverDialogProps) {
  const primaryRef = useRef<HTMLButtonElement | null>(null);
  const isRecord = score > 0 && score >= best;

  return (
    <Dialog open={open} labelledBy="game-over-title" describedBy="game-over-text" initialFocusRef={primaryRef} onCancel={onDismiss}>
      <div className={styles.art}>
        <Mascot mood="sad" />
      </div>
      <h2 id="game-over-title" className={styles.title}>
        Sem espaço!
      </h2>
      <p id="game-over-text" className={styles.text}>
        Nenhuma peça da bandeja cabe no tabuleiro.
      </p>
      <dl className={styles.stats}>
        <div>
          <dt>Pontos</dt>
          <dd>
            {isRecord && <span className={styles.badge}>Novo recorde</span>}
            {formatNumber(score)}
          </dd>
        </div>
        <div>
          <dt>Recorde</dt>
          <dd>{formatNumber(best)}</dd>
        </div>
        <div>
          <dt>Moedas na partida</dt>
          <dd>
            <CoinIcon />+{formatNumber(runCoins)}
          </dd>
        </div>
      </dl>
      <div className={styles.actions}>
        <button ref={primaryRef} type="button" className={styles.primary} onClick={onRestart}>
          Jogar de novo
        </button>
        {canReroll && (
          <button type="button" className={styles.secondary} onClick={onReroll}>
            <ShuffleIcon />
            Trocar peças
            <span aria-hidden="true">·</span>
            <CoinIcon />
            {rerollPrice}
          </button>
        )}
      </div>
    </Dialog>
  );
}
