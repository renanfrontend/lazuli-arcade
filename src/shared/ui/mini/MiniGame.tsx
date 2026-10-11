import type { ReactNode } from 'react';
import type { ArcadeServices } from '../../application/arcade';
import { BackIcon } from '../icons';
import { Dialog } from '../Dialog';
import { useArcadeSettings } from '../hooks/useArcadeSettings';
import styles from './MiniGame.module.css';

interface ShellProps {
  readonly services: ArcadeServices;
  readonly title: string;
  readonly label: string;
  readonly score: number;
  readonly best: number;
  readonly help: string;
  readonly accent: string;
  readonly onExit: () => void;
  readonly onPause: () => void;
  readonly canPause: boolean;
  readonly children: ReactNode;
}

export function MiniGame({ services, title, label, score, best, help, accent, onExit, onPause, canPause, children }: ShellProps) {
  const [settings, update] = useArcadeSettings(services.settings);
  return (
    <div className={styles.page} style={{ '--brand': accent }}
      onPointerDownCapture={() => { services.audio.unlock(); }}
      onKeyDownCapture={() => { services.audio.unlock(); }}>
      <div className={styles.layout}>
        <header className={styles.header}>
          <button className={styles.icon} type="button" aria-label="Voltar ao arcade" onClick={onExit}><BackIcon /></button>
          <div><p className={styles.eyebrow}>LAZULI ARCADE</p><h1 className={styles.title}>{title}</h1></div>
          <button className={styles.icon} type="button" aria-label={settings.sound ? 'Desligar som' : 'Ligar som'}
            onClick={() => { update({ sound: !settings.sound }); }}>{settings.sound ? '♪' : '♫'}</button>
        </header>
        <div className={styles.hud}>
          <div><span>{label}</span><strong>{score}</strong></div>
          <div><span>RECORDE</span><strong>{best}</strong></div>
          <button type="button" className={styles.smallButton} disabled={!canPause} onClick={onPause}>Ⅱ Pausar</button>
        </div>
        <main className={styles.content}>{children}</main>
        <p className={styles.help}>{help}</p>
      </div>
    </div>
  );
}

export function GameDialog({ open, title, text, onCancel, children }: {
  readonly open: boolean; readonly title: string; readonly text: string;
  readonly onCancel: () => void; readonly children: ReactNode;
}) {
  return <Dialog open={open} labelledBy="mini-game-title" describedBy="mini-game-description" onCancel={onCancel}>
    <div className={styles.dialogContent}>
      <span className={styles.dialogBadge} aria-hidden="true">✦</span>
      <h2 id="mini-game-title" className={styles.dialogTitle}>{title}</h2>
      <p id="mini-game-description">{text}</p>
      <div className={styles.dialogActions}>{children}</div>
    </div>
  </Dialog>;
}
