import { useState } from 'react';
import type { GameProps } from '@shared/ui/arcade';
import { BackIcon, ExternalIcon } from '@shared/ui/icons';
import styles from './Manor.module.css';

/** Manor Escape ships as its own app; the arcade hosts it so it sits next to the other games. */
export const MANOR_URL = 'https://renanfrontend.github.io/manor-escape/';

export default function ManorEscapeGame({ onExit }: GameProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={styles.page}>
      <header className={styles.bar}>
        <button type="button" className={styles.back} aria-label="Voltar ao arcade" onClick={onExit}>
          <BackIcon />
        </button>
        <h1 className={styles.title}>Manor Escape</h1>
        <a className={styles.open} href={MANOR_URL} target="_blank" rel="noopener">
          Abrir em nova aba <ExternalIcon className={styles.openIcon} />
        </a>
      </header>
      <div className={styles.frameWrap}>
        {!loaded && <p className={styles.loading} role="status">Abrindo a mansão…</p>}
        <iframe
          className={styles.frame}
          title="Manor Escape"
          src={MANOR_URL}
          allow="fullscreen; autoplay"
          referrerPolicy="no-referrer"
          onLoad={() => { setLoaded(true); }}
        />
      </div>
    </div>
  );
}
