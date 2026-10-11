import { useRef } from 'react';
import { Dialog } from '@shared/ui/Dialog';
import dialog from '@shared/ui/Dialog.module.css';
import { BackIcon, HelpIcon, PlayIcon, RestartIcon, SoundOffIcon, SoundOnIcon } from '@shared/ui/icons';
import type { EndReason } from '../../domain';
import type { Stats } from '../../application/stats';
import { countLabel, formatNumber, RESULT_COPY } from '../copy';
import styles from './EmpilhaDialogs.module.css';

interface PauseDialogProps {
  readonly open: boolean;
  readonly sound: boolean;
  readonly onResume: () => void;
  readonly onToggleSound: () => void;
  readonly onHelp: () => void;
  readonly onRestart: () => void;
  readonly onExit: () => void;
}

export function PauseDialog({ open, sound, onResume, onToggleSound, onHelp, onRestart, onExit }: PauseDialogProps) {
  const resumeRef = useRef<HTMLButtonElement | null>(null);
  return (
    <Dialog open={open} labelledBy="empilha-pause-title" describedBy="empilha-pause-text" initialFocusRef={resumeRef} onCancel={onResume}>
      <h2 id="empilha-pause-title" className={dialog.title}>
        Pausado
      </h2>
      <p id="empilha-pause-text" className={dialog.text}>
        O oponente também para enquanto este menu estiver aberto.
      </p>
      <div className={dialog.actions}>
        <button ref={resumeRef} type="button" className={dialog.primary} onClick={onResume}>
          <PlayIcon />
          Continuar
        </button>
        <button type="button" className={dialog.secondary} aria-pressed={sound} onClick={onToggleSound}>
          {sound ? <SoundOnIcon /> : <SoundOffIcon />}
          {sound ? 'Som ligado' : 'Som desligado'}
        </button>
        <button type="button" className={dialog.secondary} onClick={onHelp}>
          <HelpIcon />
          Como jogar
        </button>
        <button type="button" className={dialog.secondary} onClick={onRestart}>
          <RestartIcon />
          Reiniciar partida
        </button>
        <button type="button" className={dialog.secondary} onClick={onExit}>
          <BackIcon />
          Voltar ao arcade
        </button>
      </div>
    </Dialog>
  );
}

interface HelpDialogProps {
  readonly open: boolean;
  readonly target: number;
  readonly clearAt: number;
  readonly unlockAt: number | null;
  readonly onClose: () => void;
}

export function HelpDialog({ open, target, clearAt, unlockAt, onClose }: HelpDialogProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  return (
    <Dialog open={open} labelledBy="empilha-help-title" initialFocusRef={closeRef} onCancel={onClose}>
      <h2 id="empilha-help-title" className={dialog.title}>
        Como jogar
      </h2>
      <ul className={styles.rules}>
        <li>Arraste uma pilha da bandeja até uma casa vazia, ou toque nela e depois na casa.</li>
        <li>Pilhas vizinhas com o mesmo símbolo no topo se juntam na que tiver mais peças daquele símbolo.</li>
        <li>
          Juntou {clearAt} iguais no topo? Elas somem e viram pontos. Limpezas em sequência na mesma jogada valem em
          dobro, em triplo…
        </li>
        <li>Chegue a {formatNumber(target)} pontos antes do oponente. Se o seu tabuleiro encher, você perde.</li>
        {unlockAt !== null && <li>A casa com cadeado abre quando você chega a {unlockAt} pontos.</li>}
      </ul>
      <div className={dialog.actions}>
        <button ref={closeRef} type="button" className={dialog.primary} onClick={onClose}>
          Entendi
        </button>
      </div>
    </Dialog>
  );
}

interface ResultDialogProps {
  readonly open: boolean;
  readonly won: boolean;
  readonly reason: EndReason;
  readonly playerScore: number;
  readonly rivalScore: number;
  readonly nextLevel: number;
  readonly stats: Stats;
  readonly onNext: () => void;
  readonly onExit: () => void;
}

export function ResultDialog({ open, won, reason, playerScore, rivalScore, nextLevel, stats, onNext, onExit }: ResultDialogProps) {
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const copy = RESULT_COPY[reason];
  return (
    <Dialog open={open} labelledBy="empilha-result-title" describedBy="empilha-result-text" initialFocusRef={nextRef} onCancel={onExit}>
      <p className={styles.badge} data-won={won} aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          {won ? (
            <path
              d="M12 2.8 14.7 8.6l6.3.7-4.7 4.3 1.3 6.2L12 16.7l-5.6 3.1 1.3-6.2L3 9.3l6.3-.7Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          ) : (
            <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
          )}
        </svg>
      </p>
      <h2 id="empilha-result-title" className={dialog.title}>
        {copy.title}
      </h2>
      <p id="empilha-result-text" className={dialog.text}>
        {copy.text}
      </p>
      <dl className={dialog.stats}>
        <div>
          <dt>Você</dt>
          <dd className={styles.you}>{formatNumber(playerScore)}</dd>
        </div>
        <div>
          <dt>Oponente</dt>
          <dd className={styles.rival}>{formatNumber(rivalScore)}</dd>
        </div>
        <div>
          <dt>Vitórias</dt>
          <dd>
            {formatNumber(stats.wins)}
            {stats.streak > 1 && <span className={dialog.badge}>{countLabel(stats.streak, 'seguida', 'seguidas')}</span>}
          </dd>
        </div>
      </dl>
      <div className={dialog.actions}>
        <button ref={nextRef} type="button" className={dialog.primary} onClick={onNext}>
          {won ? `Próxima partida · nível ${nextLevel}` : 'Jogar de novo'}
        </button>
        <button type="button" className={dialog.secondary} onClick={onExit}>
          <BackIcon />
          Voltar ao arcade
        </button>
      </div>
    </Dialog>
  );
}
