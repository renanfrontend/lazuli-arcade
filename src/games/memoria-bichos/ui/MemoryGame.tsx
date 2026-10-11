import { useEffect, useState } from 'react';
import type { GameProps } from '@shared/ui/arcade';
import { GameDialog, MiniGame } from '@shared/ui/mini/MiniGame';
import { useGameKeys, useGameRecord, type Phase } from '@shared/ui/mini/useMiniGame';
import { useDocumentVisible } from '@shared/ui/hooks/useDocumentVisible';
import styles from '@shared/ui/mini/MiniGame.module.css';
import { ANIMALS, createMemory, flipMemory, hideMismatch, memoryScore } from '../domain/game';

export default function MemoryGame({ services, onExit }: GameProps) {
  const [game, setGame] = useState(() => createMemory(services.seedSource()));
  const [phase, setPhase] = useState<Phase>('ready');
  const { record, finish } = useGameRecord(services, 'memoria-bichos:v1');
  const visible = useDocumentVisible();
  const start = () => { setGame(createMemory(services.seedSource())); setPhase('playing'); };
  const pause = () => { setPhase((value) => value === 'playing' ? 'paused' : value === 'paused' ? 'playing' : value); };
  useGameKeys((key) => { if (key === 'Escape' && (phase === 'playing' || phase === 'paused')) { pause(); return true; } return false; });
  useEffect(() => {
    if (game.selected.length !== 2 || phase !== 'playing' || !visible) return undefined;
    const timer = window.setTimeout(() => { setGame(hideMismatch); }, 950);
    return () => { window.clearTimeout(timer); };
  }, [game.selected, phase, visible]);

  const flip = (index: number) => {
    if (phase !== 'playing') return;
    const next = flipMemory(game, index);
    if (next === game) return;
    setGame(next);
    services.audio.tone({ freq: next.matched.length > game.matched.length ? 880 : 440, duration: .12, gain: .1, type: 'triangle' });
    if (next.won) { finish(memoryScore(next.moves)); setPhase('over'); }
  };
  return <MiniGame services={services} title="Memória dos Bichos" label="JOGADAS" score={game.moves} best={record.best}
    accent="#8b5cf6" help="Toque para virar · Encontre os 8 pares · Tab + Enter pelo teclado · Esc pausa" onExit={onExit} onPause={pause} canPause={phase === 'playing'}>
    <p className={styles.progress} role="status">{game.matched.length} de 8 pares encontrados · recorde em pontos</p>
    <div className={styles.memoryGrid} aria-label="Cartas do jogo da memória">
      {game.cards.map((animal, index) => {
        const matched = game.matched.includes(animal);
        const revealed = matched || game.selected.includes(index);
        return <button key={index} type="button" className={styles.memoryCard} data-revealed={revealed} data-matched={matched}
          aria-label={`Carta ${index + 1}${revealed ? `: ${ANIMALS[animal] ?? ''}${matched ? ', par encontrado' : ''}` : ': virada para baixo'}`}
          aria-pressed={revealed} disabled={phase !== 'playing' || matched || game.selected.length === 2 || revealed}
          onClick={() => { flip(index); }}><span aria-hidden="true">{revealed ? ANIMALS[animal] : '✦'}</span></button>;
      })}
    </div>
    <GameDialog open={phase !== 'playing'} title={phase === 'ready' ? 'Conhece essa turma?' : phase === 'paused' ? 'Memória pausada' : 'Todos os pares!'}
      text={phase === 'ready' ? 'Vire duas cartas por vez. Encontre todos os bichos com o menor número de jogadas. Sem pressa e sem cronômetro!' : phase === 'paused' ? 'Suas cartas estão esperando. Continue quando quiser.' : `${game.moves} jogadas · ${memoryScore(game.moves)} pontos. Quanto menos jogadas, mais pontos!`}
      onCancel={() => { if (phase === 'paused') setPhase('playing'); }}>
      {phase === 'paused' && <button type="button" className={styles.primary} onClick={() => { setPhase('playing'); }}>Continuar</button>}
      <button type="button" className={phase === 'paused' ? styles.secondary : styles.primary} onClick={start}>{phase === 'ready' ? 'Virar as cartas' : 'Jogar de novo'}</button>
      <button type="button" className={styles.secondary} onClick={onExit}>Voltar ao arcade</button>
    </GameDialog>
  </MiniGame>;
}
