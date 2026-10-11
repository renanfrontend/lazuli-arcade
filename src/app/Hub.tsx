import { useMemo } from 'react';
import type { ArcadeServices } from '@shared/application/arcade';
import type { GameDefinition } from '@shared/ui/arcade';
import { ExternalIcon, PlayIcon } from '@shared/ui/icons';
import styles from './Hub.module.css';
import { markEnteredFromLobby } from './navigation';
import { OWNER } from './owner';

interface HubProps {
  readonly games: readonly GameDefinition[];
  readonly services: ArcadeServices;
}

export function Hub({ games, services }: HubProps) {
  const highlights = useMemo(
    () => new Map(games.map((game) => [game.id, game.highlights?.(services) ?? []] as const)),
    [games, services],
  );
  const year = new Date().getFullYear();

  return (
    <div className={styles.page}>
      <div className={styles.lobby}>
        <header className={styles.header}>
          <BrandMark />
          <div className={styles.heading}>
            <h1 className={styles.title}>
              Lazuli <span className={styles.accent}>Arcade</span>
            </h1>
            <p className={styles.lede}>Estratégia, lógica e ação. Escolha seu desafio no celular ou no computador.</p>
          </div>
        </header>

        <main className={styles.main}>
          <h2 className={styles.sectionTitle}>
            Jogos <span className={styles.count}>{games.length}</span>
          </h2>
          <ul className={styles.grid}>
            {games.map((game) => {
              const facts = highlights.get(game.id) ?? [];
              return (
                <li key={game.id} className={styles.item}>
                  <a className={styles.card} href={`#${game.id}`} onClick={markEnteredFromLobby}>
                    <div className={styles.art}>
                      <game.Thumbnail />
                    </div>
                    <div className={styles.body}>
                      <h3 className={styles.cardTitle}>{game.title}</h3>
                      <p className={styles.tagline}>{game.tagline}</p>
                      {facts.length > 0 && (
                        <ul className={styles.chips} aria-label="Seu progresso">
                          {facts.map((fact) => (
                            <li key={fact} className={styles.chip}>
                              {fact}
                            </li>
                          ))}
                        </ul>
                      )}
                      <span className={styles.cta}>
                        <PlayIcon />
                        Jogar
                      </span>
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
        </main>

        <footer className={styles.footer}>
          <p>
            © {year} {OWNER.name}. Todos os direitos reservados.
          </p>
          <p>
            Conheça mais em{' '}
            <a className={styles.link} href={OWNER.site} target="_blank" rel="noopener">
              {OWNER.siteLabel}
              <ExternalIcon className={styles.linkIcon} />
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

/** The arcade's cut-gem mark (same artwork as the favicon). */
function BrandMark() {
  return (
    <svg className={styles.mark} viewBox="44.4 -0.6 31.2 31.2" aria-hidden="true" focusable="false">
      <rect x="45.9" y="0.9" width="28.2" height="28.2" rx="6" fill="#0b1222" />
      <polygon points="48,3 72,3 66.5,8.5 53.5,8.5" fill="#b2c9ff" />
      <polygon points="72,3 72,27 66.5,21.5 66.5,8.5" fill="#4664f1" />
      <polygon points="72,27 48,27 53.5,21.5 66.5,21.5" fill="#18248e" />
      <polygon points="48,27 48,3 53.5,8.5 53.5,21.5" fill="#7592ff" />
      <rect x="53.5" y="8.5" width="13" height="13" rx="1.5" fill="#4664f1" />
      <ellipse cx="55.5" cy="10.5" rx="3.2" ry="1.6" fill="#ffffff" opacity="0.9" transform="rotate(-24 55.5 10.5)" />
      <rect x="48" y="3" width="24" height="24" rx="4" fill="none" stroke="#f2a536" strokeWidth="2.2" />
    </svg>
  );
}
