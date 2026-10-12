import { useMemo, useState, type ReactNode } from 'react';
import type { ArcadeServices } from '@shared/application/arcade';
import type { GameDefinition } from '@shared/ui/arcade';
import { ExternalIcon, PlayIcon } from '@shared/ui/icons';
import styles from './Hub.module.css';
import { CATEGORIES, categoryOf, type Category } from './categories';
import { markEnteredFromLobby } from './navigation';
import { OWNER } from './owner';

interface HubProps {
  readonly games: readonly GameDefinition[];
  readonly services: ArcadeServices;
}

export function Hub({ games, services }: HubProps) {
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const highlights = useMemo(() => new Map(games.map((game) => [game.id, game.highlights?.(services) ?? []] as const)), [games, services]);
  const factsOf = (game: GameDefinition) => highlights.get(game.id) ?? [];
  const counts = useMemo(() => new Map(CATEGORIES.map(({ id }) => [id, games.filter((game) => categoryOf(game) === id).length] as const)), [games]);
  const filtered = filter !== 'all';
  const spotlight = games.filter((game) => game.featured);
  const rest = games.filter((game) => !game.featured);
  return <div className={styles.page}><div className={styles.lobby}>
    <header className={styles.header}><BrandMark /><h1 className={styles.title}>Lazuli <span>Arcade</span></h1><span className={styles.headerNote}>Jogue no seu ritmo</span></header>
    <main className={styles.main}>
      <div className={styles.hero}><p className={styles.eyebrow}>{games.length} JOGOS · NO NAVEGADOR · SEM CADASTRO</p><h2>Escolha o seu <em>jogo.</em></h2><p className={styles.lede}>Terror, puzzles, estratégia, memória e ação.<br />Role para ver todos ou filtre por tipo.</p></div>
      <nav className={styles.filters} aria-label="Filtrar jogos por tipo">
        <button type="button" className={styles.filter} aria-pressed={!filtered} onClick={() => { setFilter('all'); }}>Todos <span>{games.length}</span></button>
        {CATEGORIES.map(({ id, label }) => <button key={id} type="button" className={styles.filter} aria-pressed={filter === id} onClick={() => { setFilter(id); }}>{label} <span>{counts.get(id) ?? 0}</span></button>)}
      </nav>
      {filtered ? <Section title={CATEGORIES.find((c) => c.id === filter)?.label ?? ''} blurb={CATEGORIES.find((c) => c.id === filter)?.blurb ?? ''}>
        {games.filter((game) => categoryOf(game) === filter).map((game) => <GameCard key={game.id} game={game} facts={factsOf(game)} />)}
      </Section> : <>
        <section aria-labelledby="spot"><h2 id="spot" className={styles.sectionTitle}>Em destaque</h2>
          <ul className={styles.featuredGrid}>{spotlight.slice(0, 1).map((game) => <GameCard key={game.id} game={game} facts={factsOf(game)} featured />)}</ul>
          <ul className={`${styles.grid} ${styles.pair}`}>{spotlight.slice(1).map((game) => <GameCard key={game.id} game={game} facts={factsOf(game)} />)}</ul></section>
        {CATEGORIES.map(({ id, label, blurb }) => {
          const list = rest.filter((game) => categoryOf(game) === id);
          return list.length === 0 ? null : <Section key={id} title={label} blurb={blurb}>{list.map((game) => <GameCard key={game.id} game={game} facts={factsOf(game)} />)}</Section>;
        })}
      </>}
    </main>
    <footer className={styles.footer}><p>© {new Date().getFullYear()} {OWNER.name}</p><a className={styles.link} href={OWNER.site} target="_blank" rel="noopener">{OWNER.siteLabel}<ExternalIcon className={styles.linkIcon} /></a></footer>
  </div></div>;
}

function Section({ title, blurb, children }: { readonly title: string; readonly blurb: string; readonly children: ReactNode }) {
  const id = `sec-${title.toLowerCase()}`;
  return <section aria-labelledby={id} className={styles.section}><h2 id={id} className={styles.sectionTitle}>{title}<span>{blurb}</span></h2><ul className={styles.grid}>{children}</ul></section>;
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
