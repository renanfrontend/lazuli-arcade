import { useEffect, useEffectEvent, useRef, useState, type PointerEvent } from 'react';
import type { GameProps } from '@shared/ui/arcade';
import { GameDialog, MiniGame } from '@shared/ui/mini/MiniGame';
import { useGameKeys, useGameRecord, type Phase } from '@shared/ui/mini/useMiniGame';
import { useDocumentVisible } from '@shared/ui/hooks/useDocumentVisible';
import styles from '@shared/ui/mini/MiniGame.module.css';
import { createSnake, sameCell, SIZE, stepSnake, turnSnake, type Direction } from '../domain/game';

const KEYS: Readonly<Record<string, Direction>> = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };

export default function SnakeGame({ services, onExit }: GameProps) {
  const [game, setGame] = useState(() => createSnake(services.seedSource()));
  const [phase, setPhase] = useState<Phase>('ready');
  const { record, finish } = useGameRecord(services, 'cobrinha-cristais:v1');
  const visible = useDocumentVisible();
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const start = () => { setGame(createSnake(services.seedSource())); setPhase('playing'); };
  const turn = (direction: Direction) => { if (phase === 'playing') setGame((state) => turnSnake(state, direction)); };
  const pause = () => { setPhase((value) => value === 'playing' ? 'paused' : value === 'paused' ? 'playing' : value); };
  useGameKeys((key) => {
    if (key === 'Escape' && (phase === 'playing' || phase === 'paused')) { pause(); return true; }
    const direction = KEYS[key];
    if (direction && phase === 'playing') { turn(direction); return true; }
    return false;
  });
  const tick = useEffectEvent(() => {
    const next = stepSnake(game);
    setGame(next);
    if (next.score > game.score) services.audio.tone({ freq: 660, to: 990, duration: .1, gain: .12 });
    if (next.status !== 'playing') { finish(next.score); setPhase('over'); }
  });
  const speed = Math.max(70, 180 - game.score / 2);
  useEffect(() => {
    if (phase !== 'playing' || !visible) return undefined;
    const timer = window.setInterval(() => { tick(); }, speed);
    return () => { window.clearInterval(timer); };
  }, [phase, visible, speed]);

  const onSwipe = (event: PointerEvent<HTMLDivElement>) => {
    const origin = swipe.current;
    swipe.current = null;
    if (!origin) return;
    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 15) return;
    turn(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up');
  };
  const bodyCells = new Set(game.body.map((cell) => cell.y * SIZE + cell.x));
  return <MiniGame services={services} title="Cobrinha de Cristais" label="PONTOS" score={game.score} best={record.best}
    accent="#059669" help="Deslize no tabuleiro ou use os botões · Setas / WASD · Esc pausa" onExit={onExit} onPause={pause} canPause={phase === 'playing'}>
    <div className={styles.board}>
      <div className={styles.snakeGrid} role="img" aria-label={`Tabuleiro da cobrinha. ${game.score} pontos. ${game.body.length} segmentos.`}
        onPointerDown={(event) => { swipe.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }}
        onPointerUp={onSwipe} onPointerCancel={() => { swipe.current = null; }}>
        {Array.from({ length: SIZE * SIZE }, (_, i) => {
          const cell = { x: i % SIZE, y: Math.floor(i / SIZE) };
          const head = game.body[0];
          const appearance = head && sameCell(cell, head) ? styles.snakeHead : bodyCells.has(i) ? styles.snakeBody : game.food && sameCell(cell, game.food) ? styles.food : '';
          return <span key={i} className={`${styles.snakeCell} ${appearance}`} />;
        })}
      </div>
    </div>
    <div className={styles.directionPad} aria-label="Controles de direção">
      {(['up', 'left', 'down', 'right'] as const).map((direction) => <button type="button" key={direction}
        className={styles[direction]} aria-label={{ up: 'Subir', left: 'Esquerda', down: 'Descer', right: 'Direita' }[direction]}
        disabled={phase !== 'playing'} onClick={() => { turn(direction); }}>{ { up: '↑', left: '←', down: '↓', right: '→' }[direction] }</button>)}
    </div>
    <GameDialog open={phase !== 'playing'} title={phase === 'ready' ? 'Caça aos cristais!' : phase === 'paused' ? 'Cobrinha pausada' : game.status === 'won' ? 'Tabuleiro completo!' : 'Fim da aventura'}
      text={phase === 'ready' ? 'Colete cristais para crescer. Evite as paredes e o próprio corpo. A cada cristal, o ritmo aumenta!' : phase === 'paused' ? 'Respire. Sua partida continua de onde parou.' : `Você fez ${game.score} pontos. Recorde: ${record.best}.`}
      onCancel={() => { if (phase === 'paused') setPhase('playing'); }}>
      {phase === 'paused' && <button type="button" className={styles.primary} onClick={() => { setPhase('playing'); }}>Continuar</button>}
      <button type="button" className={phase === 'paused' ? styles.secondary : styles.primary} onClick={start}>{phase === 'ready' ? 'Jogar agora' : 'Jogar de novo'}</button>
      <button type="button" className={styles.secondary} onClick={onExit}>Voltar ao arcade</button>
    </GameDialog>
  </MiniGame>;
}
