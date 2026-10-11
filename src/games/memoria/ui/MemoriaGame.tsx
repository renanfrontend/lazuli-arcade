import { useEffect, useEffectEvent, useMemo, useState, useSyncExternalStore } from 'react';
import { castMember } from '@shared/cast/cast';
import { createSimpleFeedback } from '@shared/infrastructure/audio/simpleFeedback';
import type { GameProps } from '@shared/ui/arcade';
import { Avatar } from '@shared/ui/cast';
import { countLabel } from '@shared/ui/format';
import { useAnnouncer } from '@shared/ui/hooks/useAnnouncer';
import { MiniFrame } from '@shared/ui/minigame/MiniFrame';
import { MiniResult } from '@shared/ui/minigame/MiniResult';
import { createMemoriaStore, MEMORIA_STORE } from '../application/save';
import { isWon, matchedPairs, needsSettle, PAIRS } from '../domain/memory';
import styles from './MemoriaGame.module.css';

/** How long a wrong pair stays visible before it turns back. */
const REVEAL_MS = 850;

export default function MemoriaGame({ services, onExit }: GameProps) {
  const feedback = useMemo(() => createSimpleFeedback(services.audio), [services.audio]);
  const [store] = useState(() => createMemoriaStore(services.openStore(MEMORIA_STORE), services.seedSource));
  const { game, best } = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  const [liveRef, announce] = useAnnouncer();
  const won = isWon(game);
  const waiting = needsSettle(game);

  const settle = useEffectEvent(() => {
    const before = store.getState().game;
    const [a, b] = before.cards.flatMap((card, index) => (card.face === 'up' ? [index] : []));
    const cardA = a === undefined ? undefined : before.cards[a];
    const cardB = b === undefined ? undefined : before.cards[b];
    const after = store.dispatch({ type: 'settle' }).game;
    if (!cardA || !cardB) return;
    if (cardA.cast === cardB.cast) {
      feedback.cue(isWon(after) ? 'win' : 'good', matchedPairs(after));
      announce(
        isWon(after)
          ? `Par de ${castMember(cardA.cast).name}! Você achou todos os pares em ${countLabel(after.moves, 'jogada', 'jogadas')}.`
          : `Par de ${castMember(cardA.cast).name}! Faltam ${PAIRS - matchedPairs(after)}.`,
      );
    } else {
      feedback.cue('bad');
      announce(`Sem par: ${castMember(cardA.cast).name} e ${castMember(cardB.cast).name}. As cartas viraram de volta.`);
    }
  });

  useEffect(() => {
    if (!waiting) return;
    const timer = window.setTimeout(settle, REVEAL_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [waiting]);

  const flip = (index: number) => {
    const card = game.cards[index];
    if (card?.face !== 'down' || waiting) return;
    feedback.cue('tap');
    store.dispatch({ type: 'flip', index });
    announce(`${castMember(card.cast).name}.`);
  };

  const restart = () => {
    store.dispatch({ type: 'newGame', seed: services.seedSource() });
    announce('Novo jogo. Todas as cartas viradas para baixo.');
  };

  return (
    <MiniFrame
      title="Memória"
      themeClass={styles.theme ?? ''}
      stats={[
        { label: 'Jogadas', value: String(game.moves) },
        { label: 'Pares', value: `${matchedPairs(game)}/${PAIRS}` },
        { label: 'Melhor', value: best === null ? '—' : String(best) },
      ]}
      onExit={onExit}
      onRestart={restart}
      onFirstGesture={services.audio.unlock}
    >
      <div className={styles.board} role="group" aria-label="Cartas">
        {game.cards.map((card, index) => {
          const open = card.face !== 'down';
          const name = castMember(card.cast).name;
          return (
            <button
              key={index}
              type="button"
              className={styles.card}
              data-face={card.face}
              aria-label={open ? `Carta ${index + 1}: ${name}${card.face === 'matched' ? ', par encontrado' : ''}` : `Carta ${index + 1}: virada para baixo`}
              aria-disabled={card.face !== 'down' || waiting}
              onClick={() => {
                flip(index);
              }}
            >
              <span className={styles.inner}>
                <span className={styles.back} aria-hidden="true">
                  <svg viewBox="0 0 40 40" focusable="false">
                    <path d="M20 5 33 15 28 33H12L7 15Z" fill="currentColor" opacity="0.35" />
                    <path d="M20 5 33 15H7ZM12 33 20 15 28 33" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" opacity="0.7" />
                  </svg>
                </span>
                <span className={styles.front} style={{ '--tone': castMember(card.cast).color }} aria-hidden="true">
                  <Avatar id={card.cast} mood={card.face === 'matched' ? 'happy' : 'idle'} decorative />
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <MiniResult
        open={won}
        id="memoria-result"
        title="Todos os pares!"
        text={best === game.moves ? 'Seu melhor resultado até agora.' : 'Dá para fazer em menos jogadas?'}
        art={<Avatar id="coruja" mood="happy" size={96} decorative />}
        stats={[
          { label: 'Jogadas', value: String(game.moves) },
          { label: 'Melhor', value: best === null ? '—' : String(best) },
        ]}
        againLabel="Jogar de novo"
        onAgain={restart}
        onExit={onExit}
      />
      <p ref={liveRef} className="sr-only" aria-live="polite" aria-atomic="true" />
    </MiniFrame>
  );
}
