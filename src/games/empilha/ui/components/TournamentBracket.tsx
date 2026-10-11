import type { TournamentState, TournamentMatch } from '../../domain/tournament';
import { ROUND_NAMES } from '../../domain/tournament';
import { getCharacter } from '../../domain/characters';
import { CharacterAvatar } from './CharacterAvatar';
import styles from './TournamentBracket.module.css';

interface TournamentBracketProps {
  readonly tournament: TournamentState;
  readonly onPlayMatch: () => void;
  readonly onResetTournament: () => void;
  readonly onClose: () => void;
}

export function TournamentBracket({
  tournament,
  onPlayMatch,
  onResetTournament,
  onClose,
}: TournamentBracketProps) {
  const qfMatches = tournament.matches.filter((m) => m.round === 0);
  const sfMatches = tournament.matches.filter((m) => m.round === 1);
  const finalMatches = tournament.matches.filter((m) => m.round === 2);

  const canPlay = tournament.status === 'in_progress';
  const wonTournament = tournament.status === 'won';
  const eliminated = tournament.status === 'eliminated';

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.trophyBadge}>🏆 Torneio dos Bichos</span>
            <h2 className={styles.title}>Copa Lazuli de Empilha</h2>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        {wonTournament && (
          <div className={styles.bannerWon}>
            <span className={styles.trophyIcon}>🏆</span>
            <div>
              <h3>Grande Campeão!</h3>
              <p>Você superou todos os adversários e ergueu a Taça dos Bichos!</p>
            </div>
          </div>
        )}

        {eliminated && (
          <div className={styles.bannerLost}>
            <span className={styles.lostIcon}>😢</span>
            <div>
              <h3>Fim de Jornada</h3>
              <p>Você foi eliminado nesta rodada. Mas não desanime, tente a revanche!</p>
            </div>
          </div>
        )}

        <div className={styles.bracketContainer}>
          <div className={styles.roundCol}>
            <h4 className={styles.roundHeading}>{ROUND_NAMES[0]}</h4>
            <div className={styles.matchesList}>
              {qfMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </div>

          <div className={styles.connectorCol} />

          <div className={styles.roundCol}>
            <h4 className={styles.roundHeading}>{ROUND_NAMES[1]}</h4>
            <div className={styles.matchesList}>
              {sfMatches.length > 0 ? (
                sfMatches.map((match) => <MatchCard key={match.id} match={match} />)
              ) : (
                <div className={styles.placeholderMatch}>Aguardando vencedores...</div>
              )}
            </div>
          </div>

          <div className={styles.connectorCol} />

          <div className={styles.roundCol}>
            <h4 className={styles.roundHeading}>{ROUND_NAMES[2]}</h4>
            <div className={styles.matchesList}>
              {finalMatches.length > 0 ? (
                finalMatches.map((match) => <MatchCard key={match.id} match={match} />)
              ) : (
                <div className={styles.placeholderMatch}>Aguardando finalistas...</div>
              )}
            </div>
          </div>
        </div>

        <footer className={styles.footer}>
          {canPlay && (
            <button type="button" className={styles.playBtn} onClick={onPlayMatch}>
              ▶ Jogar Partida do Torneio
            </button>
          )}

          {(wonTournament || eliminated) && (
            <button type="button" className={styles.resetBtn} onClick={onResetTournament}>
              🔄 Iniciar Novo Torneio
            </button>
          )}

          <div className={styles.trophyCounter}>
            Troféus Conquistados: <strong>{tournament.trophiesCount} 🏆</strong>
          </div>
        </footer>
      </div>
    </div>
  );
}

function MatchCard({ match }: { readonly match: TournamentMatch }) {
  const comp1 = match.competitor1;
  const comp2 = match.competitor2;
  const isFinished = match.status === 'completed';
  const isActive = match.status === 'active';
  const winner1 = isFinished && match.winnerId === comp1.id;
  const winner2 = isFinished && match.winnerId === comp2.id;

  const char1 = comp1.characterId ? getCharacter(comp1.characterId) : null;
  const char2 = comp2.characterId ? getCharacter(comp2.characterId) : null;

  return (
    <div className={`${styles.matchCard} ${isActive ? styles.matchActive : ''}`}>
      <div className={`${styles.competitorRow} ${winner1 ? styles.winner : ''}`}>
        <div className={styles.competitorInfo}>
          {char1 ? (
            <CharacterAvatar characterId={char1.id} size={22} animated={false} />
          ) : (
            <span className={styles.playerAvatarBadge}>⭐</span>
          )}
          <span className={styles.compName}>{comp1.name}</span>
        </div>
        {isFinished && <span className={styles.score}>{match.score1}</span>}
      </div>

      <div className={styles.divider} />

      <div className={`${styles.competitorRow} ${winner2 ? styles.winner : ''}`}>
        <div className={styles.competitorInfo}>
          {char2 ? (
            <CharacterAvatar characterId={char2.id} size={22} animated={false} />
          ) : (
            <span className={styles.playerAvatarBadge}>⭐</span>
          )}
          <span className={styles.compName}>{comp2.name}</span>
        </div>
        {isFinished && <span className={styles.score}>{match.score2}</span>}
      </div>

      {isActive && <span className={styles.activeTag}>Partida Atual</span>}
    </div>
  );
}
