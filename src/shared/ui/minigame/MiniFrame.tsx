import type { ReactNode } from 'react';
import { BackIcon, RestartIcon } from '../icons';
import styles from './MiniFrame.module.css';

export interface MiniStat {
  readonly label: string;
  readonly value: string;
}

interface MiniFrameProps {
  readonly title: string;
  readonly stats: readonly MiniStat[];
  readonly onExit: () => void;
  readonly onRestart: () => void;
  /** Class from the game's own theme module, defining the --mg-* tokens. */
  readonly themeClass: string;
  readonly onFirstGesture?: () => void;
  readonly children: ReactNode;
}

/**
 * Frame shared by the lightweight games: back, title, live stats, restart. The game supplies
 * its palette through `--mg-bg`, `--mg-glow`, `--mg-fg`, `--mg-soft`, `--mg-accent`, `--mg-panel`.
 */
export function MiniFrame({ title, stats, onExit, onRestart, themeClass, onFirstGesture, children }: MiniFrameProps) {
  return (
    <div
      className={`${styles.frame} ${themeClass}`}
      onPointerDownCapture={onFirstGesture}
      onKeyDownCapture={onFirstGesture}
      onContextMenu={(event) => {
        event.preventDefault();
      }}
    >
      <header className={styles.bar}>
        <button type="button" className={styles.icon} aria-label="Voltar ao arcade" title="Voltar ao arcade" onClick={onExit}>
          <BackIcon />
        </button>
        <h1 className={styles.title}>{title}</h1>
        <button type="button" className={styles.icon} aria-label="Recomeçar" title="Recomeçar" onClick={onRestart}>
          <RestartIcon />
        </button>
      </header>
      <dl className={styles.stats}>
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
