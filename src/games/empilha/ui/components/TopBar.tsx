import { BackIcon, GearIcon } from '@shared/ui/icons';
import styles from './TopBar.module.css';

interface TopBarProps {
  readonly level: number;
  readonly onExit: () => void;
  readonly onMenu: () => void;
  readonly isTournament?: boolean;
  readonly tournamentRoundName?: string;
  readonly onOpenTournament?: () => void;
}

export function TopBar({
  level,
  onExit,
  onMenu,
  isTournament = false,
  tournamentRoundName,
  onOpenTournament,
}: TopBarProps) {
  return (
    <header className={styles.bar}>
      <button
        type="button"
        className={styles.icon}
        aria-label="Voltar ao arcade"
        title="Voltar ao arcade"
        onClick={onExit}
      >
        <BackIcon />
      </button>

      <div className={styles.centerGroup}>
        <span className={styles.game}>Empilha</span>

        {isTournament ? (
          <button
            type="button"
            className={`${styles.chip} ${styles.tourChip}`}
            onClick={onOpenTournament}
            title="Ver Chaveamento do Torneio"
          >
            🏆 {tournamentRoundName ?? 'Torneio'}
          </button>
        ) : (
          <div className={styles.chipsRow}>
            <span className={styles.chip}>Nível {level}</span>
            {onOpenTournament && (
              <button
                type="button"
                className={`${styles.chip} ${styles.tourBtn}`}
                onClick={onOpenTournament}
                title="Abrir Torneio dos Bichos"
              >
                🏆 Torneio
              </button>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        className={styles.icon}
        aria-label="Pausar e ajustes"
        title="Pausar e ajustes"
        onClick={onMenu}
      >
        <GearIcon />
      </button>
    </header>
  );
}
