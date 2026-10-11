import { useMemo, useState, useSyncExternalStore } from 'react';
import { createSimpleFeedback } from '@shared/infrastructure/audio/simpleFeedback';
import type { GameProps } from '@shared/ui/arcade';
import { Avatar } from '@shared/ui/cast';
import { useAnnouncer } from '@shared/ui/hooks/useAnnouncer';
import { MiniFrame } from '@shared/ui/minigame/MiniFrame';
import { MiniResult } from '@shared/ui/minigame/MiniResult';
import { createFrascosStore, FRASCOS_STORE } from '../application/save';
import { CAPACITY, isSolved, pourAmount, type Flask } from '../domain/frascos';
import styles from './FrascosGame.module.css';
import { SWATCHES } from './glyphs';

const describeFlask = (flask: Flask, index: number): string => {
  const label = `Frasco ${index + 1}`;
  if (flask.length === 0) return `${label}: vazio.`;
  return `${label}: ${flask.map((color) => SWATCHES[color]?.name ?? '?').join(', ')} (de baixo para cima).`;
};

export default function FrascosGame({ services, onExit }: GameProps) {
  const feedback = useMemo(() => createSimpleFeedback(services.audio), [services.audio]);
  const [store] = useState(() => createFrascosStore(services.openStore(FRASCOS_STORE), services.seedSource));
  const { level, game } = useSyncExternalStore(store.subscribe, store.getState, store.getState);
  const [selected, setSelected] = useState<number | null>(null);
  const [landed, setLanded] = useState<{ flask: number; count: number } | null>(null);
  const [liveRef, announce] = useAnnouncer();
  const solved = isSolved(game.flasks);

  const choose = (index: number) => {
    if (solved) return;
    const { flasks } = store.getState().game;
    if (selected === null) {
      if ((flasks[index]?.length ?? 0) === 0) {
        feedback.cue('bad');
        return;
      }
      setSelected(index);
      feedback.cue('tap');
      announce(`${describeFlask(flasks[index] ?? [], index)} Escolha o frasco de destino.`);
      return;
    }
    if (selected === index) {
      setSelected(null);
      announce('Seleção cancelada.');
      return;
    }
    const amount = pourAmount(flasks, selected, index);
    if (amount === 0) {
      // Not a legal pour: pick the new flask instead when it has something to pour.
      feedback.cue('bad');
      setSelected((flasks[index]?.length ?? 0) > 0 ? index : null);
      announce('Não dá para despejar aí.');
      return;
    }
    const after = store.dispatch({ type: 'pour', from: selected, to: index }).game;
    setSelected(null);
    setLanded({ flask: index, count: amount });
    if (isSolved(after.flasks)) {
      feedback.cue('win');
      announce(`Nível concluído em ${after.moves} jogadas!`);
    } else {
      feedback.cue('move');
      announce(`Despejou ${amount}. ${describeFlask(after.flasks[index] ?? [], index)}`);
    }
  };

  const columns = game.flasks.length > 6 ? Math.ceil(game.flasks.length / 2) : game.flasks.length;

  return (
    <MiniFrame
      title="Frascos"
      themeClass={styles.theme ?? ''}
      stats={[
        { label: 'Nível', value: String(level) },
        { label: 'Jogadas', value: String(game.moves) },
      ]}
      onExit={onExit}
      onRestart={() => {
        setSelected(null);
        store.dispatch({ type: 'restart' });
        announce('Nível reiniciado.');
      }}
      onFirstGesture={services.audio.unlock}
    >
      <div className={styles.column}>
        <div className={styles.flasks} style={{ '--cols': columns }} role="group" aria-label="Frascos">
          {game.flasks.map((flask, index) => (
            <button
              key={index}
              type="button"
              className={styles.flask}
              data-selected={selected === index}
              data-done={flask.length === CAPACITY && flask.every((color) => color === flask[0])}
              aria-label={describeFlask(flask, index)}
              aria-pressed={selected === index}
              onClick={() => {
                choose(index);
              }}
            >
              <span className={styles.glass}>
                {flask.map((color, position) => {
                  const swatch = SWATCHES[color];
                  const fresh = landed?.flask === index && position >= flask.length - landed.count;
                  return (
                    <span
                      key={position}
                      className={styles.segment}
                      data-fresh={fresh}
                      style={{ '--seg': swatch?.color ?? '#999' }}
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 24 24" focusable="false">
                        {swatch?.glyph}
                      </svg>
                    </span>
                  );
                })}
              </span>
            </button>
          ))}
        </div>
        <div className={styles.tools}>
          <button
            type="button"
            disabled={game.history.length === 0 || solved}
            onClick={() => {
              setSelected(null);
              setLanded(null);
              store.dispatch({ type: 'undo' });
              announce('Jogada desfeita.');
            }}
          >
            Desfazer
          </button>
          <button
            type="button"
            disabled={solved}
            onClick={() => {
              setSelected(null);
              setLanded(null);
              store.dispatch({ type: 'reshuffle', seed: services.seedSource() });
              announce('Novo arranjo para este nível.');
            }}
          >
            Embaralhar
          </button>
        </div>
      </div>
      <MiniResult
        open={solved}
        id="frascos-result"
        title={`Nível ${level} concluído!`}
        text="Todas as cores separadas. O próximo nível traz mais uma cor."
        art={<Avatar id="elefantinho" mood="happy" size={96} decorative />}
        stats={[
          { label: 'Jogadas', value: String(game.moves) },
          { label: 'Próximo', value: `Nível ${level + 1}` },
        ]}
        againLabel="Próximo nível"
        onAgain={() => {
          setLanded(null);
          store.dispatch({ type: 'nextLevel', seed: services.seedSource() });
        }}
        onExit={onExit}
      />
      <p ref={liveRef} className="sr-only" aria-live="polite" aria-atomic="true" />
    </MiniFrame>
  );
}
