import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GameProps } from '@shared/ui/arcade';
import { Dialog } from '@shared/ui/Dialog';
import { StrategyShell } from '@shared/ui/strategy/StrategyShell';
import { useGameKeys, useGameRecord } from '@shared/ui/mini/useMiniGame';
import styles from '@shared/ui/strategy/Strategy.module.css';
import { chooseMove, countDiscs, initialReversi, legalMoves, playReversi, restoreReversi, type Difficulty, type ReversiState } from '../domain/game';

export default function ReversiGame({ services, onExit }: GameProps) {
  const store = useMemo(() => services.openStore('reversi:v1'), [services]);
  const [game, setGame] = useState(() => restoreReversi(store.read('position')) ?? initialReversi());
  const [difficulty, setDifficulty] = useState<Difficulty>(() => { const raw = store.read('difficulty'); return raw === 'easy' || raw === 'hard' ? raw : 'normal'; });
  const [paused, setPaused] = useState(false);
  const [restart, setRestart] = useState(false);
  const [dismissedResult, setDismissedResult] = useState(false);
  const [last, setLast] = useState<number | null>(null);
  const { record, finish } = useGameRecord(services, 'reversi:v1');
  const black = countDiscs(game.board, 1), white = countDiscs(game.board, -1);
  const moves = legalMoves(game.board, game.turn);
  const commit = useCallback((next: ReversiState, index: number) => {
    if (next === game) return;
    store.write('position', next); setGame(next); setLast(index);
    services.audio.tone({ freq: next.turn === 1 ? 540 : 360, duration: .08, gain: .06, type: 'sine' });
    if (next.over && !game.over) finish(countDiscs(next.board, 1));
  }, [game, store, services, finish]);
  useEffect(() => {
    if (game.over || game.turn !== -1 || paused || restart) return undefined;
    const timer = window.setTimeout(() => {
      const index = chooseMove(game, difficulty, services.seedSource());
      if (index !== null) commit(playReversi(game, index), index);
    }, 400);
    return () => { window.clearTimeout(timer); };
  }, [game, difficulty, paused, restart, services, commit]);
  useGameKeys((key) => { if (key === 'Escape' && !game.over && !restart) { setPaused((v) => !v); return true; } return false; });
  const fresh = (level: Difficulty = difficulty) => {
    const next = initialReversi(); store.write('position', next); store.write('difficulty', level);
    setGame(next); setDifficulty(level); setLast(null); setPaused(false); setRestart(false); setDismissedResult(false);
  };
  const result = black === white ? 'Empate' : black > white ? 'Você venceu' : 'O computador venceu';
  const message = game.over ? `${result} · ${black} × ${white}` : paused ? 'Partida pausada' : game.turn === -1 ? 'Computador pensando…' : `${game.passed === -1 ? 'Computador sem jogada. ' : ''}Sua vez · ${moves.length} jogadas possíveis`;
  return <StrategyShell services={services} onExit={onExit} title="Reversi" genre="ESTRATÉGIA">
    <div className={styles.hud}><div className={styles.stat}><span>Você / pretas</span><strong>{black}</strong></div><div className={styles.stat}><span>CPU / brancas</span><strong>{white}</strong></div><div className={styles.stat}><span>Melhor placar</span><strong>{record.best}</strong></div></div>
    <div className={styles.toolbar}><label htmlFor="reversi-level">Nível </label><select id="reversi-level" className={styles.select} value={difficulty} onChange={(event) => { const level = event.target.value as Difficulty; fresh(level); }}>
      <option value="easy">Iniciante</option><option value="normal">Intermediário</option><option value="hard">Avançado</option>
    </select><button className={styles.button} type="button" onClick={() => { setRestart(true); }}>Nova partida</button><button className={styles.button} disabled={game.over} type="button" onClick={() => { setPaused(true); }}>Pausar</button></div>
    <p className={styles.status} role="status">{message}</p>
    <div className={styles.reversi} role="group" aria-label="Tabuleiro Reversi de 8 por 8">
      {game.board.map((disc, index) => <button key={index} type="button" className={styles.square} disabled={paused || restart || game.over || game.turn !== 1 || !moves.includes(index)}
        aria-label={`${String.fromCharCode(65 + index % 8)}${Math.floor(index / 8) + 1}: ${disc === 1 ? 'preta' : disc === -1 ? 'branca' : moves.includes(index) && game.turn === 1 ? 'jogada disponível' : 'vazia'}`}
        onClick={() => { commit(playReversi(game, index), index); }}>
        {disc !== 0 ? <span className={styles.disc} data-player={disc} aria-hidden="true" /> : moves.includes(index) && game.turn === 1 ? <span className={styles.hint} aria-hidden="true" /> : null}
        {last === index && <span className={styles.last} aria-hidden="true" />}
      </button>)}
    </div>
    <details className={styles.rules}><summary>Como jogar e pensar à frente</summary><p>Você joga com as pretas. Coloque uma peça para cercar as brancas entre a nova peça e outra preta, em uma linha horizontal, vertical ou diagonal. Todas as peças cercadas viram para sua cor.</p><p>Os pontos marcam suas jogadas legais. Sem jogada, a vez passa automaticamente; a partida acaba quando ninguém pode jogar. Vence quem tiver mais peças.</p><p>Os cantos não podem ser capturados: disputá-los e limitar as opções do adversário costuma valer mais que capturar muitas peças no início. Mudar o nível inicia outra partida. A posição é salva a cada jogada.</p></details>
    <Dialog open={paused || restart || (game.over && !dismissedResult)} labelledBy="reversi-dialog" onCancel={() => { setPaused(false); setRestart(false); setDismissedResult(true); }}>
      <div className={styles.modal}><h2 id="reversi-dialog">{restart ? 'Começar outra partida?' : paused ? 'Partida pausada' : result}</h2><p>{restart ? 'A posição atual será substituída. Seu melhor placar permanece salvo.' : paused ? 'A posição está salva. Retome quando quiser.' : `${black} peças pretas × ${white} peças brancas.`}</p>
        {(paused || restart) && <button className={styles.primary} type="button" onClick={() => { setPaused(false); setRestart(false); }}>Continuar partida</button>}
        {!paused && <button className={styles.button} type="button" onClick={() => { fresh(); }}>Nova partida</button>}
        {game.over && !restart && <button className={styles.button} type="button" onClick={() => { setDismissedResult(true); }}>Ver tabuleiro</button>}
        <button className={styles.button} type="button" onClick={onExit}>Voltar ao arcade</button>
      </div>
    </Dialog>
  </StrategyShell>;
}
