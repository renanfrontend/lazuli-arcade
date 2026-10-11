import { Avatar } from '@shared/ui/cast';
import styles from './MemoriaThumbnail.module.css';

/** Lobby artwork: a few cards, some turned over. */
export function MemoriaThumbnail() {
  return (
    <div className={styles.art} aria-hidden="true">
      <span className={styles.card}>
        <Avatar id="rabito" decorative />
      </span>
      <span className={`${styles.card} ${styles.down}`} />
      <span className={`${styles.card} ${styles.down}`} />
      <span className={styles.card}>
        <Avatar id="tata" decorative />
      </span>
    </div>
  );
}
