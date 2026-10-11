import { Avatar } from '@shared/ui/cast';
import styles from './DobraThumbnail.module.css';

/** Lobby artwork: three neighbours about to become the next bigger one. */
export function DobraThumbnail() {
  return (
    <div className={styles.art} aria-hidden="true">
      <span className={styles.tile}>
        <Avatar id="tata" decorative />
        <b>2</b>
      </span>
      <span className={styles.tile}>
        <Avatar id="tata" decorative />
        <b>2</b>
      </span>
      <span className={styles.arrow}>→</span>
      <span className={`${styles.tile} ${styles.big}`}>
        <Avatar id="porquinho" decorative />
        <b>4</b>
      </span>
    </div>
  );
}
