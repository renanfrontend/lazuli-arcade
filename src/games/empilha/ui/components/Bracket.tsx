import { castMember } from '@shared/cast/cast';
import { Avatar } from '@shared/ui/cast';
import { BackIcon, PlayIcon, RestartIcon } from '@shared/ui/icons';
import type { TournamentSession } from '../../application/tournamentStore';
import {
  championOf,
  currentRound,
  nextRival,
  pairingsOf,
  ROUND_NAMES,
  ROUNDS,
  type Entrant,
} from '../../domain';
import styles from './Bracket.module.css';

interface BracketProps {
  readonly session: TournamentSession;
  readonly onPlay: () => void;
  readonly onNew: () => void;
  readonly onBack: () => void;
}

const nameOf = (entrant: Entrant) => (entrant === 'player' ? 'Você' : castMember(entrant).name);

function Chip({ entrant, state }: { readonly entrant: Entrant | null; readonly state: 'won' | 'lost' | 'open' }) {
  if (entrant === null) {
    return (
      <span className={styles.chip} data-state="open" data-tbd="true">
        <span className={styles.tbd} aria-hidden="true">
          ?
        </span>
        <span className={styles.name}>A definir</span>
      </span>
    );
  }
  return (
    <span className={styles.chip} data-state={state} data-player={entrant === 'player'}>
      {entrant === 'player' ? (
        <span className={styles.you} aria-hidden="true">
          Você
        </span>
      ) : (
        <Avatar id={entrant} size={30} decorative />
      )}
      <span className={styles.name}>{nameOf(entrant)}</span>
    </span>
  );
}

/** The bracket: three columns, your path highlighted, finished matches dimming the loser. */
export function Bracket({ session, onPlay, onNew, onBack }: BracketProps) {
  const { tournament, status } = session;
  const round = currentRound(tournament);
  const rival = nextRival(tournament);
  const champion = championOf(tournament);
  return (
    <div className={styles.bracket}>
      <header className={styles.top}>
        <button type="button" className={styles.back} aria-label="Voltar ao menu" onClick={onBack}>
          <BackIcon />
        </button>
        <h1 className={styles.title}>Torneio</h1>
      </header>

      <p className={styles.status} role="status" data-status={status}>
        {status === 'playing' && rival
          ? `${ROUND_NAMES[round] ?? ''}: você enfrenta ${nameOf(rival)}`
          : status === 'champion'
            ? '🏆 Campeão! Você venceu o torneio.'
            : `Eliminado. ${champion && champion !== 'player' ? `${nameOf(champion)} levou o troféu.` : ''}`}
      </p>

      <div className={styles.columns}>
        {Array.from({ length: ROUNDS }, (_, index) => (
          <section key={index} className={styles.column} aria-label={ROUND_NAMES[index]}>
            <h2>{ROUND_NAMES[index]}</h2>
            {pairingsOf(tournament, index).map((pairing, match) => (
              <div key={match} className={styles.match} data-mine={pairing.a === 'player' || pairing.b === 'player'}>
                {[pairing.a, pairing.b].map((entrant, side) => (
                  <Chip
                    key={`${entrant}-${side}`}
                    entrant={entrant}
                    state={pairing.winner === null ? 'open' : pairing.winner === entrant ? 'won' : 'lost'}
                  />
                ))}
              </div>
            ))}
          </section>
        ))}
      </div>

      <div className={styles.actions}>
        {status === 'playing' && rival ? (
          <button type="button" className={styles.primary} onClick={onPlay}>
            <PlayIcon />
            Jogar contra {nameOf(rival)}
          </button>
        ) : (
          <button type="button" className={styles.primary} onClick={onNew}>
            <RestartIcon />
            Novo torneio
          </button>
        )}
      </div>
    </div>
  );
}
