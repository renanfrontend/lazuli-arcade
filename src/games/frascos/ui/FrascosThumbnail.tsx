import { SWATCHES } from './glyphs';
import styles from './FrascosThumbnail.module.css';

const ART: readonly (readonly number[])[] = [[0, 0, 2, 2], [4, 4, 4, 4], [2, 5, 5], [5, 0, 0]];

/** Lobby artwork: a few flasks mid-sort. */
export function FrascosThumbnail() {
  return (
    <div className={styles.art} aria-hidden="true">
      {ART.map((flask, index) => (
        <span key={index} className={styles.flask}>
          {flask.map((color, position) => (
            <i key={position} style={{ '--seg': SWATCHES[color]?.color ?? '#999' }} />
          ))}
        </span>
      ))}
    </div>
  );
}
