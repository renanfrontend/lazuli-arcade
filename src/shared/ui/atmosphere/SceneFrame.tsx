import type { ReactNode } from 'react';
import type { GameProps } from '../arcade';
import { BackIcon } from '../icons';
import { useArcadeSettings } from '../hooks/useArcadeSettings';
import styles from './Scene.module.css';
export function SceneFrame({ services, onExit, title, eyebrow, onPause, paused, children }: GameProps & {
  readonly title: string; readonly eyebrow: string; readonly onPause: () => void; readonly paused: boolean; readonly children: ReactNode;
}) {
  const [settings, update] = useArcadeSettings(services.settings);
  return <div className={styles.page} onPointerDownCapture={() => { services.audio.unlock(); }} onKeyDownCapture={() => { services.audio.unlock(); }}>
    <div className={styles.layout}><header className={styles.header}>
      <button className={styles.icon} type="button" aria-label="Voltar ao arcade" onClick={onExit}><BackIcon /></button>
      <div className={styles.heading}><p>{eyebrow}</p><h1>{title}</h1></div>
      <div className={styles.headerActions}><button type="button" className={styles.pill} aria-label={settings.sound ? 'Desligar som' : 'Ligar som'} onClick={() => { update({ sound: !settings.sound }); }}><span aria-hidden="true">♪</span><span className={styles.soundText}>{settings.sound ? 'Som ligado' : 'Som desligado'}</span></button>
        <button type="button" className={styles.icon} aria-label={paused ? 'Continuar jogo' : 'Pausar jogo'} onClick={onPause}>{paused ? '▷' : 'Ⅱ'}</button></div>
    </header>{children}</div>
  </div>;
}
