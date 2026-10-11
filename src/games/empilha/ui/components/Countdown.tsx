import styles from './Countdown.module.css';

/** 3, 2, 1, Já! — both players start together. */
export function Countdown({ value }: { readonly value: number | null }) {
  if (value === null) return null;
  return (
    <div className={styles.overlay} role="status" aria-live="assertive">
      <span key={value} className={styles.number} data-go={value === 0}>
        {value === 0 ? 'Já!' : value}
      </span>
    </div>
  );
}
