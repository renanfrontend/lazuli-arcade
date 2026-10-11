import type { Ref } from 'react';
import type { Character } from '../../domain/characters';
import { formatNumber } from '../copy';
import { CharacterAvatar } from './CharacterAvatar';
import styles from './ScoreRace.module.css';

interface ScoreRaceProps {
  readonly player: number;
  readonly rival: number;
  readonly target: number;
  readonly playerFillRef: Ref<HTMLDivElement>;
  readonly rivalFillRef: Ref<HTMLDivElement>;
  readonly character?: Character;
}

const progress = (value: number, target: number) => Math.min(1, Math.max(0, value / target));

export function ScoreRace({ player, rival, target, playerFillRef, rivalFillRef, character }: ScoreRaceProps) {
  const rivalName = character?.name ?? 'Oponente';

  return (
    <section className={styles.race} aria-label="Placar">
      <div className={styles.labels}>
        <span className={styles.you}>Você</span>
        <strong className={styles.target} aria-label={`Meta: ${formatNumber(target)} pontos`}>
          {formatNumber(target)}
        </strong>
        <div className={styles.rivalHeader}>
          {character && <CharacterAvatar characterId={character.id} size={18} animated={false} />}
          <span className={styles.rivalLabel}>{rivalName}</span>
        </div>
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
          aria-label={`Pontos de ${rivalName}`}
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
