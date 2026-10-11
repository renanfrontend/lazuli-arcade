import type { ReactNode } from 'react';
import type { GameProps } from '../arcade';
import { BackIcon } from '../icons';
import { useArcadeSettings } from '../hooks/useArcadeSettings';
import styles from './Strategy.module.css';
export function StrategyShell({ title, genre, services, onExit, children }: GameProps & { readonly title: string; readonly genre: string; readonly children: ReactNode }) {
  const [settings, update] = useArcadeSettings(services.settings);
  return <div className={styles.page} onPointerDownCapture={() => { services.audio.unlock(); }} onKeyDownCapture={() => { services.audio.unlock(); }}>
    <div className={styles.layout}><header className={styles.header}>
      <button type="button" className={styles.icon} aria-label="Voltar ao arcade" onClick={onExit}><BackIcon /></button>
      <div><p className={styles.eyebrow}>LAZULI / {genre}</p><h1>{title}</h1></div>
      <button type="button" className={styles.icon} aria-label={settings.sound ? 'Desligar som' : 'Ligar som'} onClick={() => { update({ sound: !settings.sound }); }}>{settings.sound ? '♪' : '♫'}</button>
    </header>{children}</div>
  </div>;
}
