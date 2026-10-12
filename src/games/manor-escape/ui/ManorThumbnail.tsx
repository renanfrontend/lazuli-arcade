import cover from '../../../assets/scenes/manor-escape.webp';
import styles from './Manor.module.css';

export function ManorThumbnail() {
  return <img className={styles.thumb} src={cover} alt="" width={640} height={400} loading="lazy" decoding="async" />;
}
