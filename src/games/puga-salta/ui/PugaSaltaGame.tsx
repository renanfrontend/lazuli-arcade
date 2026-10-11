import { useEffect, useRef, useState, useCallback, type PointerEvent } from 'react';
import type { GameProps } from '@shared/ui/arcade';
import { BackIcon, GearIcon } from '@shared/ui/icons';
import { PUGA_STORE, loadPugaStats, recordPugaGame } from '../application/stats';
import { createPugaFeedback } from '../infrastructure/pugaFeedback';
import styles from './PugaSaltaGame.module.css';

interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'normal' | 'moving' | 'spring' | 'fragile';
  vx?: number;
  broken?: boolean;
}

interface Item {
  x: number;
  y: number;
  type: 'bone' | 'star' | 'shield';
  collected?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

const GRAVITY = 0.38;
const JUMP_POWER = -11.5;
const SPRING_POWER = -18.5;
const CANVAS_WIDTH = 380;
const CANVAS_HEIGHT = 600;

const drawRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.rect(x, y, w, h);
  }
};

export default function PugaSaltaGame({ services, onExit }: GameProps) {
  const store = services.openStore(PUGA_STORE);
  const feedback = createPugaFeedback(services.audio);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stats, setStats] = useState(() => loadPugaStats(store));
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [currentScore, setCurrentScore] = useState(0);
  const [currentBones, setCurrentBones] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);

  const pugaRef = useRef({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 120,
    vx: 0,
    vy: JUMP_POWER,
    w: 36,
    h: 36,
    facingLeft: false,
    hasShield: false,
    invincibleTimer: 0,
  });

  const platformsRef = useRef<Platform[]>([]);
  const itemsRef = useRef<Item[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const cameraYRef = useRef(0);
  const maxHeightRef = useRef(0);
  const bonesCountRef = useRef(0);
  const inputLeftRef = useRef(false);
  const inputRightRef = useRef(false);

  const resetGame = useCallback(() => {
    pugaRef.current = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 120,
      vx: 0,
      vy: JUMP_POWER,
      w: 36,
      h: 36,
      facingLeft: false,
      hasShield: false,
      invincibleTimer: 0,
    };

    cameraYRef.current = 0;
    maxHeightRef.current = 0;
    bonesCountRef.current = 0;
    particlesRef.current = [];
    setCurrentScore(0);
    setCurrentBones(0);
    setIsNewRecord(false);

    const initialPlats: Platform[] = [
      { x: CANVAS_WIDTH / 2 - 40, y: CANVAS_HEIGHT - 60, w: 80, h: 14, type: 'normal' },
    ];

    let currentY = CANVAS_HEIGHT - 130;
    while (currentY > -1000) {
      const typeRoll = Math.random();
      const type: Platform['type'] =
        typeRoll > 0.85 ? 'spring' : typeRoll > 0.65 ? 'moving' : typeRoll > 0.5 ? 'fragile' : 'normal';

      const w = type === 'fragile' ? 65 : 75;
      const x = Math.random() * (CANVAS_WIDTH - w);
      initialPlats.push({
        x,
        y: currentY,
        w,
        h: 14,
        type,
        vx: type === 'moving' ? (Math.random() > 0.5 ? 2 : -2) : 0,
      });

      if (Math.random() < 0.35 && type !== 'fragile') {
        const itemType = Math.random() < 0.15 ? 'shield' : Math.random() < 0.3 ? 'star' : 'bone';
        itemsRef.current.push({
          x: x + w / 2,
          y: currentY - 18,
          type: itemType,
        });
      }

      currentY -= 55 + Math.random() * 25;
    }

    platformsRef.current = initialPlats;
    setGameState('playing');
    feedback.cue('jump');
  }, [feedback]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const spawnParticles = (x: number, y: number, color: string, count = 6) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 20 + Math.random() * 15,
          color,
          size: Math.random() * 4 + 2,
        });
      }
    };

    const update = () => {
      const puga = pugaRef.current;

      if (inputLeftRef.current) {
        puga.vx = -4.5;
        puga.facingLeft = true;
      } else if (inputRightRef.current) {
        puga.vx = 4.5;
        puga.facingLeft = false;
      } else {
        puga.vx *= 0.88;
      }

      puga.x += puga.vx;
      puga.vy += GRAVITY;
      puga.y += puga.vy;

      if (puga.x < -puga.w / 2) puga.x = CANVAS_WIDTH + puga.w / 2;
      if (puga.x > CANVAS_WIDTH + puga.w / 2) puga.x = -puga.w / 2;

      if (puga.vy > 0) {
        for (const plat of platformsRef.current) {
          if (plat.broken) continue;
          if (
            puga.x + puga.w / 2 > plat.x &&
            puga.x - puga.w / 2 < plat.x + plat.w &&
            puga.y + puga.h / 2 >= plat.y &&
            puga.y + puga.h / 2 <= plat.y + plat.h + puga.vy
          ) {
            puga.y = plat.y - puga.h / 2;

            if (plat.type === 'spring') {
              puga.vy = SPRING_POWER;
              feedback.cue('spring');
              spawnParticles(puga.x, puga.y + puga.h / 2, '#f59e0b', 12);
            } else if (plat.type === 'fragile') {
              plat.broken = true;
              puga.vy = JUMP_POWER;
              feedback.cue('jump');
              spawnParticles(plat.x + plat.w / 2, plat.y, '#92400e', 10);
            } else {
              puga.vy = JUMP_POWER;
              feedback.cue('jump');
              spawnParticles(puga.x, puga.y + puga.h / 2, '#22c55e', 6);
            }
            break;
          }
        }
      }

      for (const item of itemsRef.current) {
        if (item.collected) continue;
        const dx = puga.x - item.x;
        const dy = puga.y - item.y;
        if (Math.hypot(dx, dy) < 26) {
          item.collected = true;
          if (item.type === 'bone') {
            bonesCountRef.current += 1;
            setCurrentBones(bonesCountRef.current);
            feedback.cue('bone');
            spawnParticles(item.x, item.y, '#fef08a', 8);
          } else if (item.type === 'star') {
            bonesCountRef.current += 5;
            setCurrentBones(bonesCountRef.current);
            feedback.cue('bone');
            spawnParticles(item.x, item.y, '#fde047', 14);
          } else if (item.type === 'shield') {
            puga.hasShield = true;
            feedback.cue('powerup');
            spawnParticles(item.x, item.y, '#38bdf8', 15);
          }
        }
      }

      for (const plat of platformsRef.current) {
        if (plat.type === 'moving' && plat.vx !== undefined) {
          plat.x += plat.vx;
          if (plat.x < 0 || plat.x + plat.w > CANVAS_WIDTH) {
            plat.vx *= -1;
          }
        }
      }

      const targetCamY = CANVAS_HEIGHT / 2 - puga.y;
      if (targetCamY > cameraYRef.current) {
        cameraYRef.current += (targetCamY - cameraYRef.current) * 0.15;
      }

      const height = Math.floor(Math.max(0, -puga.y + CANVAS_HEIGHT - 120) / 10);
      if (height > maxHeightRef.current) {
        maxHeightRef.current = height;
        setCurrentScore(height);
      }

      const highestPlatY = platformsRef.current.reduce((min, p) => Math.min(min, p.y), CANVAS_HEIGHT);
      const cameraTop = -cameraYRef.current;
      if (highestPlatY > cameraTop - 200) {
        let nextY = highestPlatY - (55 + Math.random() * 25);
        for (let i = 0; i < 4; i++) {
          const typeRoll = Math.random();
          const type: Platform['type'] =
            typeRoll > 0.85 ? 'spring' : typeRoll > 0.65 ? 'moving' : typeRoll > 0.5 ? 'fragile' : 'normal';
          const w = type === 'fragile' ? 65 : 75;
          const x = Math.random() * (CANVAS_WIDTH - w);
          platformsRef.current.push({
            x,
            y: nextY,
            w,
            h: 14,
            type,
            vx: type === 'moving' ? (Math.random() > 0.5 ? 2.2 : -2.2) : 0,
          });

          if (Math.random() < 0.35 && type !== 'fragile') {
            const itemType = Math.random() < 0.15 ? 'shield' : Math.random() < 0.3 ? 'star' : 'bone';
            itemsRef.current.push({
              x: x + w / 2,
              y: nextY - 18,
              type: itemType,
            });
          }
          nextY -= 55 + Math.random() * 25;
        }
      }

      const cameraBottom = -cameraYRef.current + CANVAS_HEIGHT + 100;
      platformsRef.current = platformsRef.current.filter((p) => p.y < cameraBottom);
      itemsRef.current = itemsRef.current.filter((item) => item.y < cameraBottom && !item.collected);

      if (puga.y > cameraBottom - 60) {
        if (puga.hasShield) {
          puga.hasShield = false;
          puga.vy = SPRING_POWER;
          feedback.cue('spring');
          spawnParticles(puga.x, puga.y, '#38bdf8', 20);
        } else {
          feedback.cue('fall');
          feedback.cue('gameover');
          const finalHeight = maxHeightRef.current;
          const finalBones = bonesCountRef.current;
          const updated = recordPugaGame(store, finalHeight, finalBones);
          setStats(updated);
          setIsNewRecord(finalHeight > stats.bestHeight);
          setGameState('gameover');
          return;
        }
      }

      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;
      }
      particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife);

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.6, '#38bdf8');
      skyGrad.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.save();
      ctx.translate(0, cameraYRef.current);

      for (const plat of platformsRef.current) {
        if (plat.broken) continue;

        ctx.save();
        if (plat.type === 'spring') {
          ctx.fillStyle = '#f59e0b';
          drawRoundRect(ctx, plat.x, plat.y, plat.w, plat.h, 6);
          ctx.fill();

          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(plat.x + plat.w / 2, plat.y - 4, 8, Math.PI, 0);
          ctx.stroke();
        } else if (plat.type === 'moving') {
          ctx.fillStyle = '#0284c7';
          drawRoundRect(ctx, plat.x, plat.y, plat.w, plat.h, 6);
          ctx.fill();

          ctx.fillStyle = '#38bdf8';
          drawRoundRect(ctx, plat.x + 3, plat.y + 2, plat.w - 6, 4, 2);
          ctx.fill();
        } else if (plat.type === 'fragile') {
          ctx.fillStyle = '#b45309';
          drawRoundRect(ctx, plat.x, plat.y, plat.w, plat.h, 6);
          ctx.fill();

          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(plat.x + plat.w * 0.4, plat.y);
          ctx.lineTo(plat.x + plat.w * 0.6, plat.y + plat.h);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#16a34a';
          drawRoundRect(ctx, plat.x, plat.y, plat.w, plat.h, 6);
          ctx.fill();

          ctx.fillStyle = '#4ade80';
          drawRoundRect(ctx, plat.x + 3, plat.y + 2, plat.w - 6, 4, 2);
          ctx.fill();
        }
        ctx.restore();
      }

      for (const item of itemsRef.current) {
        if (item.collected) continue;
        ctx.save();
        ctx.translate(item.x, item.y);

        if (item.type === 'bone') {
          ctx.fillStyle = '#fef08a';
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 1.5;
          drawRoundRect(ctx, -10, -4, 20, 8, 4);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(-10, -5, 3.5, 0, Math.PI * 2);
          ctx.arc(-10, 5, 3.5, 0, Math.PI * 2);
          ctx.arc(10, -5, 3.5, 0, Math.PI * 2);
          ctx.arc(10, 5, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (item.type === 'star') {
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === 'shield') {
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(0, 0, 9, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      for (const p of particlesRef.current) {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 1 - p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(puga.x, puga.y);
      if (puga.facingLeft) ctx.scale(-1, 1);

      if (puga.hasShield) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.ellipse(-14, -6, 5, 8, -0.2, 0, Math.PI * 2);
      ctx.ellipse(14, -6, 5, 8, 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.ellipse(0, 5, 10, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-6, -2, 4, 0, Math.PI * 2);
      ctx.arc(6, -2, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(-5, -2, 2.2, 0, Math.PI * 2);
      ctx.arc(7, -2, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.ellipse(1, 9, 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      ctx.restore();

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);
    return () => { cancelAnimationFrame(animId); };
  }, [gameState, feedback, stats.bestHeight, store]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        inputLeftRef.current = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        inputRightRef.current = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        inputLeftRef.current = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        inputRightRef.current = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    services.audio.unlock();
    if (gameState !== 'playing') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    if (touchX < rect.width / 2) {
      inputLeftRef.current = true;
      inputRightRef.current = false;
    } else {
      inputRightRef.current = true;
      inputLeftRef.current = false;
    }
  };

  const handlePointerUp = () => {
    inputLeftRef.current = false;
    inputRightRef.current = false;
  };

  return (
    <div
      className={styles.page}
      onPointerDownCapture={() => { services.audio.unlock(); }}
      onKeyDownCapture={() => { services.audio.unlock(); }}
    >
      <header className={styles.topBar}>
        <button type="button" className={styles.iconBtn} onClick={onExit} aria-label="Voltar">
          <BackIcon />
        </button>
        <div className={styles.scoreBoard}>
          <span className={styles.scoreText}>{currentScore}m</span>
          <span className={styles.bonesText}>🦴 {currentBones}</span>
        </div>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => {
            if (gameState === 'playing') setGameState('ready');
          }}
          aria-label="Opções"
        >
          <GearIcon />
        </button>
      </header>

      <main
        className={styles.gameArea}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className={styles.canvas}
        />

        {gameState === 'ready' && (
          <div className={styles.overlay}>
            <div className={styles.startCard}>
              <h2 className={styles.gameTitle}>Puga Salta! 🐶</h2>
              <p className={styles.gameSubtitle}>
                Ajude o Puga a pular nas plataformas, coletar ossinhos e alcançar o topo das nuvens!
              </p>
              <div className={styles.controlsInfo}>
                <span>👈 Toque na esquerda para mover à esquerda</span>
                <span>👉 Toque na direita para mover à direita</span>
              </div>
              <div className={styles.bestRecord}>
                Recorde: <strong>{stats.bestHeight} metros</strong> 🏆
              </div>
              <button type="button" className={styles.actionBtn} onClick={resetGame}>
                ▶ Começar Pulo!
              </button>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className={styles.overlay}>
            <div className={styles.gameOverCard}>
              <h2 className={styles.gameOverTitle}>Fim do Pulo!</h2>
              {isNewRecord && (
                <div className={styles.recordBadge}>🎉 NOVO RECORDE PESSOAL! 🎉</div>
              )}
              <div className={styles.finalScores}>
                <div className={styles.scoreItem}>
                  <span>Altura</span>
                  <strong>{currentScore} m</strong>
                </div>
                <div className={styles.scoreItem}>
                  <span>Ossinhos</span>
                  <strong>{currentBones} 🦴</strong>
                </div>
              </div>
              <div className={styles.bestRecord}>
                Melhor Marca: <strong>{stats.bestHeight} metros</strong> 🏆
              </div>
              <div className={styles.btnRow}>
                <button type="button" className={styles.actionBtn} onClick={resetGame}>
                  🔄 Pular de Novo!
                </button>
                <button type="button" className={styles.secondaryBtn} onClick={onExit}>
                  Voltar ao Arcade
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
