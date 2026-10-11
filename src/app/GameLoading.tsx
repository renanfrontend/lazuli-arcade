import styles from './GameStatus.module.css';

export function GameLoading({ title }: { readonly title: string }) {
  return (
    <main className={styles.status} aria-busy="true">
      <span className={styles.spinner} aria-hidden="true" />
      <p className={styles.text} role="status">
        Abrindo {title}…
      </p>
    </main>
  );
}
