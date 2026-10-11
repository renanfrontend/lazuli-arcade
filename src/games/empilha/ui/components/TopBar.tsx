import { BackIcon, GearIcon } from '@shared/ui/icons';
import styles from './TopBar.module.css';

interface TopBarProps {
  readonly level: number;
  readonly onExit: () => void;
  readonly onMenu: () => void;
}

export function TopBar({ level, onExit, onMenu }: TopBarProps) {
  return (
    <header className={styles.bar}>
      <button type="button" className={styles.icon} aria-label="Voltar ao arcade" title="Voltar ao arcade" onClick={onExit}>
        <BackIcon />
      </button>
      <p className={styles.level}>
        <span className={styles.game}>Empilha</span>
        <span className={styles.chip}>Nível {level}</span>
      </p>
      <button type="button" className={styles.icon} aria-label="Pausar e ajustes" title="Pausar e ajustes" onClick={onMenu}>
        <GearIcon />
      </button>
    </header>
  );
}
