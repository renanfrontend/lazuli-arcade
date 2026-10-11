import type { Ref } from 'react';
import { countLabel, formatNumber } from '../copy';
import { CountUp } from './CountUp';
import styles from './Hud.module.css';
import { CoinIcon, RestartIcon, SoundOffIcon, SoundOnIcon } from './icons';
import { Mascot, type MascotMood } from './Mascot';

interface HudProps {
  readonly mood: MascotMood;
  readonly coins: number;
  readonly score: number;
  readonly best: number;
  readonly sound: boolean;
  readonly reducedMotion: boolean;
  readonly coinRef: Ref<HTMLSpanElement>;
  readonly onToggleSound: () => void;
  readonly onRestart: () => void;
}

const coinSize = (coins: number) => {
  const digits = formatNumber(coins).length;
  if (digits <= 3) return 'lg';
  return digits <= 5 ? 'md' : 'sm';
};

export function Hud({ mood, coins, score, best, sound, reducedMotion, coinRef, onToggleSound, onRestart }: HudProps) {
  return (
    <header className={styles.hud}>
      <div className={styles.mascot}>
        <Mascot mood={mood} />
      </div>

      <div className={styles.purse}>
        <p className={styles.coins} data-size={coinSize(coins)}>
          <span ref={coinRef} className={styles.coinIcon}>
            <CoinIcon />
          </span>
          <span className={styles.times} aria-hidden="true">
            ×
          </span>
          <CountUp value={coins} className={styles.coinValue} delayUp={520} reducedMotion={reducedMotion} />
          <span className="sr-only">{countLabel(coins, 'moeda', 'moedas')}</span>
        </p>
        <dl className={styles.scores}>
          <div>
            <dt>Pontos</dt>
            <dd>
              <CountUp value={score} duration={420} reducedMotion={reducedMotion} />
              <span className="sr-only">{formatNumber(score)}</span>
            </dd>
          </div>
          <div>
            <dt>Recorde</dt>
            <dd>{formatNumber(best)}</dd>
          </div>
        </dl>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Som e vibração"
          aria-pressed={sound}
          title={sound ? 'Desligar som' : 'Ligar som'}
          onClick={onToggleSound}
        >
          {sound ? <SoundOnIcon /> : <SoundOffIcon />}
        </button>
        <button type="button" className={styles.iconButton} aria-label="Nova partida" title="Nova partida" onClick={onRestart}>
          <RestartIcon />
        </button>
      </div>
    </header>
  );
}
