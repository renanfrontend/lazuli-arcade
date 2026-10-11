import { CAST, castMember, type CastId } from '@shared/cast/cast';
import { Avatar } from '@shared/ui/cast';
import { countLabel } from '@shared/ui/format';
import { BackIcon, PlayIcon } from '@shared/ui/icons';
import type { Stats } from '../../application/stats';
import type { TournamentSession } from '../../application/tournamentStore';
import { findRival, nextRival, ROUND_NAMES, currentRound } from '../../domain';
import styles from './Home.module.css';

interface HomeProps {
  readonly stats: Stats;
  /** Rival of a match in progress that can be resumed. */
  readonly resumable: CastId | null;
  readonly tournament: TournamentSession | null;
  readonly onResume: () => void;
  readonly onPlayRival: (id: CastId) => void;
  readonly onTournament: () => void;
  readonly onExit: () => void;
}

const Tier = ({ tier }: { readonly tier: number }) => (
  <span className={styles.tier} role="img" aria-label={`Dificuldade ${tier} de 8`}>
    {Array.from({ length: 8 }, (_, index) => (
      <i key={index} data-on={index < tier} />
    ))}
  </span>
);

/** Entry screen of Empilha: resume, tournament and a rival to face right now. */
export function Home({ stats, resumable, tournament, onResume, onPlayRival, onTournament, onExit }: HomeProps) {
  const playing = tournament?.status === 'playing';
  const rival = tournament && playing ? nextRival(tournament.tournament) : null;
  return (
    <div className={styles.home}>
      <header className={styles.top}>
        <button type="button" className={styles.back} aria-label="Voltar ao arcade" onClick={onExit}>
          <BackIcon />
        </button>
        <h1 className={styles.title}>Empilha</h1>
        <p className={styles.record}>
          {countLabel(stats.wins, 'vitória', 'vitórias')}
          {stats.titles > 0 && ` · ${countLabel(stats.titles, 'troféu', 'troféus')}`}
        </p>
      </header>

      <div className={styles.actions}>
        {resumable && (
          <button type="button" className={styles.resume} onClick={onResume}>
            <PlayIcon />
            Continuar partida contra {castMember(resumable).name}
          </button>
        )}
        <button type="button" className={styles.tournament} onClick={onTournament}>
          <span className={styles.cup} aria-hidden="true">
            🏆
          </span>
          <span>
            <strong>Torneio</strong>
            <small>
              {rival && tournament
                ? `${ROUND_NAMES[currentRound(tournament.tournament)] ?? ''} · contra ${castMember(rival).name}`
                : tournament?.status === 'champion'
                  ? 'Você é o campeão! Ver chaveamento'
                  : tournament?.status === 'eliminated'
                    ? 'Eliminado. Ver chaveamento ou começar outro'
                    : '8 competidores, 3 rodadas, 1 campeão'}
            </small>
          </span>
        </button>
      </div>

      <h2 className={styles.heading}>Partida amistosa: escolha o rival</h2>
      <ul className={styles.grid}>
        {CAST.map((member) => {
          const info = findRival(member.id);
          const beaten = stats.beaten.includes(member.id);
          return (
            <li key={member.id}>
              <button
                type="button"
                className={styles.card}
                style={{ '--tone': member.color }}
                aria-label={`${member.name}, ${member.species}${beaten ? ', já vencido' : ''}. Jogar partida amistosa.`}
                onClick={() => {
                  onPlayRival(member.id);
                }}
              >
                <span className={styles.face}>
                  <Avatar id={member.id} size={64} decorative />
                  {beaten && (
                    <span className={styles.check} aria-hidden="true">
                      ✓
                    </span>
                  )}
                </span>
                <strong>{member.name}</strong>
                <Tier tier={info.tier} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
