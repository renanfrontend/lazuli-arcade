import { useMemo, useRef, useState } from 'react';
import type { GameProps } from '@shared/ui/arcade';
import { Dialog } from '@shared/ui/Dialog';
import { StrategyShell } from '@shared/ui/strategy/StrategyShell';
import { useGameKeys } from '@shared/ui/mini/useMiniGame';
import { readRecord } from '@shared/application/records';
import styles from '@shared/ui/strategy/Strategy.module.css';
import { createGrid, isGridOver, moveGrid, restoreGrid, type Direction, type GridState } from '../domain/game';
const KEYS: Record<string, Direction> = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down' };
export default function GridGame({ services, onExit }: GameProps) {
  const store = useMemo(() => services.openStore('2048:v1'), [services]);
  const [game, setGame] = useState(() => restoreGrid(store.read('position')) ?? createGrid(services.seedSource()));
  const [record, setRecord] = useState(() => readRecord(store));
  const [previous, setPrevious] = useState<GridState | null>(null);
  const [acknowledged, setAcknowledged] = useState(() => store.read('continued') === true);
  const [paused, setPaused] = useState(false), [restart, setRestart] = useState(false);
  const touch = useRef<{ x: number; y: number; id: number } | null>(null);
  const over = isGridOver(game), won = game.board.some((v) => v >= 2048) && !acknowledged;
  const blocked = paused || restart || over || won;
  const move = (direction: Direction) => {
    if (blocked) return;
    const next = moveGrid(game, direction); if (next === game) return;
    setPrevious(game); setGame(next); store.write('position', next);
    const nextRecord = { best: Math.max(record.best, next.score), games: record.games + (isGridOver(next) ? 1 : 0) };
    setRecord(nextRecord); store.write('record', nextRecord);
    if (next.score > game.score) services.audio.tone({ freq: 460 + Math.min(next.score - game.score, 400), duration: .1, gain: .05, type: 'triangle' });
  };
  const undo = () => {
    if (!previous) return;
    setGame(previous); store.write('position', previous); setPrevious(null);
  };
  useGameKeys((key) => {
    if (key === 'Escape' && !over && !won && !restart) { setPaused((v) => !v); return true; }
    const direction = KEYS[key]; if (direction && !blocked) { move(direction); return true; }
    return false;
  });
  const fresh = () => {
    const next = createGrid(services.seedSource()); setGame(next); store.write('position', next);
    store.write('continued', false); setAcknowledged(false); setPrevious(null); setRestart(false); setPaused(false);
  };
  const resumeBeyondGoal = () => { setAcknowledged(true); store.write('continued', true); };
  return <StrategyShell services={services} onExit={onExit} title="2048" genre="LÓGICA">
    <div className={styles.hud}><div className={styles.stat}><span>Pontuação</span><strong>{game.score}</strong></div><div className={styles.stat}><span>Recorde</span><strong>{record.best}</strong></div><div className={styles.stat}><span>Maior bloco</span><strong>{Math.max(...game.board)}</strong></div></div>
    <div className={styles.toolbar}><button className={styles.button} type="button" onClick={() => { setRestart(true); }}>Novo desafio</button><button className={styles.button} type="button" onClick={undo} disabled={!previous || paused || restart}>Desfazer</button><button className={styles.button} type="button" disabled={over || won} onClick={() => { setPaused(true); }}>Pausar</button></div>
    <p className={styles.status} role="status">{over ? 'Sem movimentos. Desfaça a última jogada ou tente novamente.' : 'Una blocos iguais. Planeje o próximo movimento.'}</p>
    <div className={styles.grid} role="group" aria-label="Tabuleiro 2048 de 4 por 4"
      onPointerDown={(event) => { if (blocked || event.button !== 0) return; touch.current = { x: event.clientX, y: event.clientY, id: event.pointerId }; event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerCancel={() => { touch.current = null; }}
      onPointerUp={(event) => {
        const start = touch.current; touch.current = null;
        if (start?.id !== event.pointerId) return;
        const dx = event.clientX - start.x, dy = event.clientY - start.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
        move(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up');
      }}>
      {game.board.map((value, index) => <div key={index} className={styles.tile} data-tone={value === 0 ? 0 : Math.min(8, Math.log2(value))} data-large={value >= 1024} aria-label={`Linha ${Math.floor(index / 4) + 1}, coluna ${index % 4 + 1}: ${value || 'vazia'}`}>{value || ''}</div>)}
    </div>
    <div className={styles.dpad} aria-label="Controles de direção">{([['up', '↑', 'Subir'], ['left', '←', 'Esquerda'], ['down', '↓', 'Descer'], ['right', '→', 'Direita']] as const).map(([direction, icon, label]) => <button key={direction} type="button" className={styles.button} aria-label={label} disabled={blocked} onClick={() => { move(direction); }}>{icon}</button>)}</div>
    <details className={styles.rules}><summary>Regras e estratégia</summary><p>Deslize, use as setas / WASD ou os botões. Todos os blocos se movem na direção escolhida. Dois blocos iguais se fundem uma vez por movimento; o novo valor soma pontos. Depois de um movimento válido, aparece um bloco 2 ou 4.</p><p>Alcance 2048 e continue para bater seu recorde. Preserve espaços livres e tente manter o maior bloco num canto. Desfazer restaura uma jogada, incluindo a próxima peça aleatória. Sua partida e seu recorde são salvos a cada movimento.</p></details>
    <Dialog open={paused || restart || won || over} labelledBy="grid-dialog" onCancel={() => { if (paused || restart) { setPaused(false); setRestart(false); } }}>
      <div className={styles.modal}><h2 id="grid-dialog">{restart ? 'Começar outro desafio?' : paused ? 'Desafio pausado' : won ? '2048 alcançado' : 'Sem movimentos'}</h2><p>{restart ? 'O tabuleiro atual será substituído. Seu recorde permanece salvo.' : paused ? 'Seu tabuleiro está salvo.' : won ? 'Você venceu o desafio. Continue para alcançar 4096 e além.' : `${game.score} pontos · recorde ${record.best}.`}</p>
        {(paused || restart) && <button className={styles.primary} type="button" onClick={() => { setPaused(false); setRestart(false); }}>Continuar</button>}
        {won && !paused && !restart && <button className={styles.primary} type="button" onClick={resumeBeyondGoal}>Continuar além de 2048</button>}
        {over && previous && !restart && <button className={styles.primary} type="button" onClick={undo}>Desfazer última jogada</button>}
        {!paused && <button className={styles.button} type="button" onClick={fresh}>Novo desafio</button>}
        <button className={styles.button} type="button" onClick={onExit}>Voltar ao arcade</button>
      </div>
    </Dialog>
  </StrategyShell>;
}
