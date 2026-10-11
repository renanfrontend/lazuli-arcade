import type { Ref } from 'react';
import { castMember, type CastId } from '@shared/cast/cast';
import { Avatar, type Mood } from '@shared/ui/cast';
import { formatNumber } from '../copy';
import styles from './ScoreRace.module.css';

interface ScoreRaceProps {
  readonly player: number;
  readonly rival: number;
  readonly target: number;
  readonly rivalId: CastId;
  readonly rivalMood: Mood;
  readonly turn: 'player' | 'opponent';
  readonly playerFillRef: Ref<HTMLDivElement>;
  readonly rivalFillRef: Ref<HTMLDivElement>;
}

const progress = (value: number, target: number) => Math.min(1, Math.max(0, value / target));

/** Two bars racing towards the same target: yours fills from the left, the rival's from the right. */
export function ScoreRace({ player, rival, target, rivalId, rivalMood, turn, playerFillRef, rivalFillRef }: ScoreRaceProps) {
  return (
    <section className={styles.race} aria-label="Placar" data-turn={turn}>
      <div className={styles.labels}>
        <span className={styles.you}>Você</span>
        <strong className={styles.target} aria-label={`Meta: ${formatNumber(target)} pontos`}>
          {formatNumber(target)}
        </strong>
        <span className={styles.rivalLabel}>
          <Avatar id={rivalId} mood={rivalMood} size={26} decorative />
          {castMember(rivalId).name}
        </span>
      </div>
      <div className={styles.bars}>
        <div
          className={styles.track}
          role="meter"
          aria-label="Seus pontos"
          aria-valuemin={0}
          aria-valuemax={target}
          aria-valuenow={player}
        >
          <div ref={playerFillRef} className={`${styles.fill} ${styles.youFill}`} style={{ '--p': progress(player, target) }}>
            <span className={styles.value}>{formatNumber(player)}</span>
          </div>
        </div>
        <span className={styles.vs} aria-hidden="true">
          VS
        </span>
        <div
          className={styles.track}
          role="meter"
          aria-label={`Pontos de ${castMember(rivalId).name}`}
          aria-valuemin={0}
          aria-valuemax={target}
          aria-valuenow={rival}
        >
          <div ref={rivalFillRef} className={`${styles.fill} ${styles.rivalFill}`} style={{ '--p': progress(rival, target) }}>
            <span className={styles.value}>{formatNumber(rival)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
