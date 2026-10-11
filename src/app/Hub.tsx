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
  const highlights = useMemo(() => new Map(games.map((game) => [game.id, game.highlights?.(services) ?? []] as const)), [games, services]);
  const featured = games.filter((game) => game.featured);
  const classics = games.filter((game) => !game.featured);
  return <div className={styles.page}><div className={styles.lobby}>
    <header className={styles.header}><BrandMark /><h1 className={styles.title}>Lazuli <span>Arcade</span></h1><span className={styles.headerNote}>Jogue no seu ritmo</span></header>
    <main className={styles.main}>
      <div className={styles.hero}><p className={styles.eyebrow}>PEQUENOS MUNDOS. OUTRAS SENSAÇÕES.</p><h2>O medo tem<br /><em>uma casa.</em></h2><p className={styles.lede}>Entre na mansão do Último Espetáculo.<br />Encontre as peças. Despiste o palhaço. Fuja.</p></div>
      <h2 className={styles.sectionTitle}>Você consegue sair?</h2>
      <ul className={styles.featuredGrid}>{featured.map((game) => <GameCard key={game.id} game={game} facts={highlights.get(game.id) ?? []} featured />)}</ul>
      <details className={styles.classics}><summary>Mais jogos <span>{classics.length} clássicos e desafios</span></summary><ul className={styles.grid}>{classics.map((game) => <GameCard key={game.id} game={game} facts={highlights.get(game.id) ?? []} />)}</ul></details>
    </main>
    <footer className={styles.footer}><p>© {new Date().getFullYear()} {OWNER.name}</p><a className={styles.link} href={OWNER.site} target="_blank" rel="noopener">{OWNER.siteLabel}<ExternalIcon className={styles.linkIcon} /></a></footer>
  </div></div>;
}
function GameCard({game,facts,featured=false}:{readonly game:GameDefinition;readonly facts:readonly string[];readonly featured?:boolean}) {
  return <li className={styles.item}><a className={styles.card} data-featured={featured} href={`#${game.id}`} onClick={markEnteredFromLobby}>
    <div className={styles.art}><game.Thumbnail /></div><div className={styles.body}>
      <ul className={styles.chips} aria-label="Características do jogo">{facts.map(fact=><li key={fact} className={styles.chip}>{fact}</li>)}</ul>
      <h3 className={styles.cardTitle}>{game.title}</h3><p className={styles.tagline}>{game.tagline}</p><span className={styles.cta}><PlayIcon />{featured?'Entrar':'Jogar'}</span>
    </div>
  </a></li>;
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
