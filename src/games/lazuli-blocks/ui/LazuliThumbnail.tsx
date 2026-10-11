import { cx } from '@shared/ui/cx';
import { CoinIcon } from '@shared/ui/icons';
import { GemTile } from './components/GemTile';
import { Mascot } from './components/Mascot';
import theme from './styles/theme.module.css';
import styles from './LazuliThumbnail.module.css';

/** 6 x 3 corner of a board: two rows almost full, coins popping out of the cleared one. */
const PATTERN = ['......', '##.#..', '######'].join('');

export function LazuliThumbnail() {
  return (
    <div className={cx(theme.theme, styles.thumb)} aria-hidden="true">
      <div className={styles.board}>
        {Array.from(PATTERN, (char, index) => (
          <span key={index} className={styles.cell}>
            {char === '#' && <GemTile gem="sapphire" />}
          </span>
        ))}
      </div>
      <CoinIcon className={cx(styles.coin, styles.coinA)} />
      <CoinIcon className={cx(styles.coin, styles.coinB)} />
      <div className={styles.mascot}>
        <Mascot mood="happy" />
      </div>
    </div>
  );
}
