import { useEffect, useEffectEvent, useMemo, useRef, useState, useSyncExternalStore, type PointerEvent } from 'react';
import { CAST_IDS, castMember } from '@shared/cast/cast';
import { createSimpleFeedback } from '@shared/infrastructure/audio/simpleFeedback';
import type { GameProps } from '@shared/ui/arcade';
import { Avatar } from '@shared/ui/cast';
import { formatNumber } from '@shared/ui/format';
import { useAnnouncer } from '@shared/ui/hooks/useAnnouncer';
import { MiniFrame } from '@shared/ui/minigame/MiniFrame';
import { MiniResult } from '@shared/ui/minigame/MiniResult';
import { createDobraStore, DOBRA_STORE } from '../application/save';
import { SIZE, valueOf, type Direction, type Tile } from '../domain/dobra';
import styles from './DobraGame.module.css';

const KEYS: Readonly<Record<string, Direction>> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
  a: 'left',
  d: 'right',
  w: 'up',
  s: 'down',
};

const ARROWS: readonly { readonly direction: Direction; readonly label: string; readonly glyph: string }[] = [
  { direction: 'left', label: 'Mover para a esquerda', glyph: '←' },
  { direction: 'up', label: 'Mover para cima', glyph: '↑' },
  { direction: 'down', label: 'Mover para baixo', glyph: '↓' },
  { direction: 'right', label: 'Mover para a direita', glyph: '→' },
];

const SWIPE_MIN = 22;

/** Tile levels climb the cast: 2 is Tata, 256 is Coruja, beyond that Coruja wears gold. */
const castFor = (level: number) => CAST_IDS[Math.min(level, CAST_IDS.length) - 1] ?? 'coruja';

const biggest = (tiles: readonly Tile[]) => tiles.reduce((max, tile) => Math.max(max, tile.level), 0);

export default function DobraGame({ services, onExit }: GameProps) {
  const feedback = useMemo(() => createSimpleFeedback(services.audio), [services.audio]);
  const [store] = useState(() => createDobraStore(services.openStore(DOBRA_STORE), services.seedSource));
  const { game, best } = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  const [liveRef, announce] = useAnnouncer();
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const finished = game.status !== 'playing';

  const move = (direction: Direction) => {
    const before = store.getState().game;
    const after = store.dispatch({ type: 'move', direction }).game;
    if (after === before) {
      feedback.cue('bad');
      return;
    }
    const merges = after.tiles.filter((tile) => tile.merged);
    if (merges.length > 0) {
      feedback.cue('merge', biggest(merges));
      announce(`${merges.map((tile) => `${castMember(castFor(tile.level)).name} ${valueOf(tile.level)}`).join(', ')}.`);
    } else {
      feedback.cue('move');
    }
    if (after.status === 'won') feedback.cue('win');
    if (after.status === 'lost') feedback.cue('lose');
  };

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    const direction = KEYS[event.key];
    if (!direction || finished || event.altKey || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    move(direction);
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      onKey(event);
    };
    window.addEventListener('keydown', listener);
    return () => {
      window.removeEventListener('keydown', listener);
    };
  }, []);

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start || finished) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
  };

  const restart = () => {
    store.dispatch({ type: 'newGame', seed: services.seedSource() });
    announce('Novo jogo.');
  };

  const top = biggest(game.tiles);
  return (
    <MiniFrame
      title="Dobra"
      themeClass={styles.theme ?? ''}
      stats={[
        { label: 'Pontos', value: formatNumber(game.score) },
        { label: 'Melhor', value: formatNumber(best) },
        { label: 'Maior', value: formatNumber(valueOf(top)) },
      ]}
      onExit={onExit}
      onRestart={restart}
      onFirstGesture={services.audio.unlock}
    >
      <div className={styles.column}>
        <div
          className={styles.board}
          role="application"
          aria-label="Tabuleiro 4 por 4. Use as setas ou deslize para juntar bichinhos iguais."
          onPointerDown={(event) => {
            swipe.current = { x: event.clientX, y: event.clientY };
          }}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            swipe.current = null;
          }}
        >
          {Array.from({ length: SIZE * SIZE }, (_, key) => (
            <span key={key} className={styles.slot} />
          ))}
          {game.tiles.map((tile) => {
            const id = castFor(tile.level);
            return (
              <span
                key={tile.id}
                className={styles.tile}
                style={{ '--c': tile.col, '--r': tile.row, '--tone': castMember(id).color }}
                data-gold={tile.level > CAST_IDS.length}
                aria-label={`${castMember(id).name}, ${valueOf(tile.level)}, coluna ${tile.col + 1}, linha ${tile.row + 1}`}
                role="img"
              >
                <span className={styles.face} data-born={tile.born} data-merged={tile.merged}>
                  <Avatar id={id} mood={tile.merged ? 'happy' : 'idle'} decorative />
                  <b className={styles.value}>{valueOf(tile.level)}</b>
                </span>
              </span>
            );
          })}
        </div>
        <div className={styles.pad}>
          {ARROWS.map(({ direction, label, glyph }) => (
            <button
              key={direction}
              type="button"
              aria-label={label}
              disabled={finished}
              onClick={() => {
                move(direction);
              }}
            >
              {glyph}
            </button>
          ))}
        </div>
      </div>
      <MiniResult
        open={finished}
        id="dobra-result"
        title={game.status === 'won' ? '2048! Que bando!' : 'Sem movimentos'}
        text={game.status === 'won' ? 'Você juntou a Coruja de ouro. Quer ir além?' : 'O tabuleiro encheu. Que tal outra rodada?'}
        art={<Avatar id="coruja" mood={game.status === 'won' ? 'happy' : 'sad'} size={96} decorative />}
        stats={[
          { label: 'Pontos', value: formatNumber(game.score) },
          { label: 'Melhor', value: formatNumber(best) },
        ]}
        againLabel={game.status === 'won' ? 'Continuar jogando' : 'Jogar de novo'}
        onAgain={() => {
          if (game.status === 'won') store.dispatch({ type: 'continue' });
          else restart();
        }}
        onExit={onExit}
      />
      <p ref={liveRef} className="sr-only" aria-live="polite" aria-atomic="true" />
    </MiniFrame>
  );
}
