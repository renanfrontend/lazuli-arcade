import { useEffect, useEffectEvent, useRef, useState, type PointerEvent } from 'react';
import type { GameProps } from '@shared/ui/arcade';
import { GameDialog, MiniGame } from '@shared/ui/mini/MiniGame';
import { useGameKeys, useGameRecord, type Phase } from '@shared/ui/mini/useMiniGame';
import { useDocumentVisible } from '@shared/ui/hooks/useDocumentVisible';
import styles from '@shared/ui/mini/MiniGame.module.css';
import { createBreakout, HEIGHT, launchBall, movePaddle, PADDLE_WIDTH, PADDLE_Y, RADIUS, stepBreakout, WIDTH, type BreakoutState } from '../domain/game';

const COLORS = ['#c084fc', '#38bdf8', '#34d399', '#fbbf24'];
interface View { score: number; lives: number; stage: number; aiming: boolean }

const draw = (ctx: CanvasRenderingContext2D, game: BreakoutState) => {
  ctx.fillStyle = '#0d1b32'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#243857';
  for (let x = 12; x < WIDTH; x += 24) for (let y = 12; y < HEIGHT; y += 24) { ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill(); }
  for (const brick of game.bricks) {
    if (brick.hp === 0) continue;
    ctx.fillStyle = COLORS[brick.row] ?? '#38bdf8';
    ctx.beginPath(); ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 5); ctx.fill();
    ctx.fillStyle = '#ffffff66'; ctx.fillRect(brick.x + 5, brick.y + 3, brick.width - 10, 3);
    if (brick.hp > 1) { ctx.fillStyle = '#0d1b32'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(brick.hp), brick.x + brick.width / 2, brick.y + 14); }
  }
  ctx.fillStyle = '#38bdf8'; ctx.beginPath(); ctx.roundRect(game.paddle - PADDLE_WIDTH / 2, PADDLE_Y, PADDLE_WIDTH, 13, 6); ctx.fill();
  ctx.fillStyle = '#bae6fd'; ctx.fillRect(game.paddle - PADDLE_WIDTH / 2 + 8, PADDLE_Y + 3, PADDLE_WIDTH - 16, 3);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(game.ball.x, game.ball.y, RADIUS, 0, Math.PI * 2); ctx.fill();
  if (game.status === 'aiming') {
    ctx.fillStyle = '#b5c9e8'; ctx.textAlign = 'center'; ctx.font = 'bold 15px sans-serif';
    ctx.fillText('Toque ou aperte Espaço para lançar', WIDTH / 2, 235);
  }
};

export default function BreakoutGame({ services, onExit }: GameProps) {
  const engine = useRef(createBreakout());
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const keys = useRef({ left: false, right: false });
  const [phase, setPhase] = useState<Phase>('ready');
  const [view, setView] = useState<View>({ score: 0, lives: 3, stage: 1, aiming: true });
  const [won, setWon] = useState(false);
  const { record, finish } = useGameRecord(services, 'quebra-gemas:v1');
  const visible = useDocumentVisible();
  const start = () => {
    engine.current = createBreakout(); keys.current = { left: false, right: false };
    setView({ score: 0, lives: 3, stage: 1, aiming: true }); setWon(false); setPhase('playing');
  };
  const pause = () => { keys.current = { left: false, right: false }; setPhase((value) => value === 'playing' ? 'paused' : value === 'paused' ? 'playing' : value); };
  useGameKeys((key) => {
    if (key === 'Escape' && (phase === 'playing' || phase === 'paused')) { pause(); return true; }
    if (phase !== 'playing') return false;
    if (key === ' ' || key === 'Enter') { launchBall(engine.current); return true; }
    if (key === 'ArrowLeft' || key.toLowerCase() === 'a') { keys.current.left = true; return true; }
    if (key === 'ArrowRight' || key.toLowerCase() === 'd') { keys.current.right = true; return true; }
    return false;
  });
  useEffect(() => {
    const release = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') keys.current.left = false;
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') keys.current.right = false;
    };
    const reset = () => { keys.current = { left: false, right: false }; };
    window.addEventListener('keyup', release); window.addEventListener('blur', reset); document.addEventListener('visibilitychange', reset);
    return () => { window.removeEventListener('keyup', release); window.removeEventListener('blur', reset); document.removeEventListener('visibilitychange', reset); };
  }, []);
  const publish = useEffectEvent((game: BreakoutState) => {
    if (game.score !== view.score || game.lives !== view.lives || game.stage !== view.stage || (game.status === 'aiming') !== view.aiming) {
      if (game.score > view.score) services.audio.tone({ freq: 450 + game.stage * 100, duration: .06, gain: .08 });
      setView({ score: game.score, lives: game.lives, stage: game.stage, aiming: game.status === 'aiming' });
    }
    if (game.status === 'over' || game.status === 'won') { finish(game.score); setWon(game.status === 'won'); setPhase('over'); }
  });
  useEffect(() => {
    const context = canvas.current?.getContext('2d');
    if (!context) return undefined;
    draw(context, engine.current);
    if (phase !== 'playing' || !visible) return undefined;
    let frame = 0; let previous: number | null = null; let accumulated = 0;
    const update = (now: number) => {
      accumulated += previous === null ? 0 : Math.min(100, now - previous) / 1000;
      previous = now;
      while (accumulated >= 1 / 120) {
        const input = keys.current;
        movePaddle(engine.current, engine.current.paddle + (Number(input.right) - Number(input.left)) * 390 / 120);
        stepBreakout(engine.current, 1 / 120);
        accumulated -= 1 / 120;
      }
      draw(context, engine.current); publish(engine.current);
      if (engine.current.status !== 'over' && engine.current.status !== 'won') frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => { cancelAnimationFrame(frame); };
  }, [phase, visible]);
  const aim = (event: PointerEvent<HTMLCanvasElement>) => {
    if (phase !== 'playing') return;
    const rect = event.currentTarget.getBoundingClientRect();
    movePaddle(engine.current, (event.clientX - rect.left) / rect.width * WIDTH);
  };
  return <MiniGame services={services} title="Quebra-Gemas" label="PONTOS" score={view.score} best={record.best}
    accent="#0284c7" help="Arraste ou mova o mouse · Setas / A e D · Toque / Espaço lança · Esc pausa"
    onExit={onExit} onPause={pause} canPause={phase === 'playing'}>
    <div className={styles.lives}><span aria-label={`${view.lives} vidas`}>{'♥'.repeat(view.lives)}{'♡'.repeat(3 - view.lives)}</span><span>Fase {view.stage} de 3</span></div>
    <div className={styles.board}>
      <canvas ref={canvas} className={styles.canvas} width={WIDTH} height={HEIGHT} role="img" aria-label={`Quebra-Gemas, fase ${view.stage}, ${view.score} pontos, ${view.lives} vidas`}
        onPointerMove={aim} onPointerDown={(event) => { if (phase !== 'playing') return; event.currentTarget.setPointerCapture(event.pointerId); aim(event); launchBall(engine.current); }} />
    </div>
    {phase === 'playing' && view.aiming && <button type="button" className={styles.primary} onClick={() => { launchBall(engine.current); }}>Lançar bolinha</button>}
    <GameDialog open={phase !== 'playing'} title={phase === 'ready' ? 'Hora de quebrar gemas!' : phase === 'paused' ? 'Bolinha pausada' : won ? 'Você limpou as 3 fases!' : 'Mais uma tentativa?'}
      text={phase === 'ready' ? 'Rebata a bolinha para quebrar todas as gemas. São 3 fases e 3 vidas. Use a posição da raquete para mudar o ângulo!' : phase === 'paused' ? 'Sua bolinha está congelada. Continue de onde parou.' : `${view.score} pontos · recorde ${record.best}.`}
      onCancel={() => { if (phase === 'paused') setPhase('playing'); }}>
      {phase === 'paused' && <button type="button" className={styles.primary} onClick={() => { setPhase('playing'); }}>Continuar</button>}
      <button type="button" className={phase === 'paused' ? styles.secondary : styles.primary} onClick={start}>{phase === 'ready' ? 'Vamos jogar' : 'Jogar de novo'}</button>
      <button type="button" className={styles.secondary} onClick={onExit}>Voltar ao arcade</button>
    </GameDialog>
  </MiniGame>;
}
