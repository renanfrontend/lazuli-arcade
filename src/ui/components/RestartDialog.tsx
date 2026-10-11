import { useRef } from 'react';
import { countLabel } from '../copy';
import { Dialog } from './Dialog';
import styles from './Dialog.module.css';

interface RestartDialogProps {
  readonly open: boolean;
  readonly score: number;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export function RestartDialog({ open, score, onConfirm, onCancel }: RestartDialogProps) {
  const keepPlayingRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog open={open} labelledBy="restart-title" describedBy="restart-text" initialFocusRef={keepPlayingRef} onCancel={onCancel}>
      <h2 id="restart-title" className={styles.title}>
        Começar de novo?
      </h2>
      <p id="restart-text" className={styles.text}>
        Esta partida tem {countLabel(score, 'ponto', 'pontos')} e será encerrada. Suas moedas continuam guardadas.
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={onConfirm}>
          Nova partida
        </button>
        <button ref={keepPlayingRef} type="button" className={styles.secondary} onClick={onCancel}>
          Continuar jogando
        </button>
      </div>
    </Dialog>
  );
}
