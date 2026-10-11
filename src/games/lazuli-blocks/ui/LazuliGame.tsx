import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import type { GameProps } from '@shared/ui/arcade';
import { cx } from '@shared/ui/cx';
import { useArcadeSettings } from '@shared/ui/hooks/useArcadeSettings';
import { useReducedMotion } from '@shared/ui/hooks/useReducedMotion';
import { LAZULI_STORE } from '../application/persistence';
import type { LazuliServices } from '../application/ports';
import { useGame } from '../application/useGame';
import { useSettings } from '../application/useSettings';
import {
  canAffordReroll,
  canPlace,
  clampOrigin,
  DEFAULT_CONFIG,
  fillRatio,
  footprint,
  previewPlacement,
  rerollPrice,
  samePosition,
  type Position,
  type TrayPiece,
} from '../domain';
import { createLazuliFeedback } from '../infrastructure/lazuliFeedback';
import styles from './LazuliGame.module.css';
import { BoardView, type BoardPreview } from './components/Board';
import { DragLayer } from './components/DragLayer';
import { EffectsLayer, type EffectsHandle } from './components/EffectsLayer';
import { GameOverDialog } from './components/GameOverDialog';
import { Hud } from './components/Hud';
import { RestartDialog } from './components/RestartDialog';
import { Tray } from './components/Tray';
import { countLabel } from './copy';
import { useGameEvents } from './hooks/useGameEvents';
import { useMascotMood } from './hooks/useMascotMood';
import { usePieceDrag } from './hooks/usePieceDrag';
import { usePlacementCursor, type SelectSource } from './hooks/usePlacementCursor';
import theme from './styles/theme.module.css';

const CONFIG = DEFAULT_CONFIG;
const HELP_ID = 'board-help';
const GAME_OVER_DELAY_MS = 950;
const ARROWS: Readonly<Record<string, Position>> = {
  ArrowLeft: { col: -1, row: 0 },
  ArrowRight: { col: 1, row: 0 },
  ArrowUp: { col: 0, row: -1 },
  ArrowDown: { col: 0, row: 1 },
};

/** Composition root of the game: arcade services in, Lazuli adapters out. */
const useLazuliServices = ({ openStore, audio, seedSource }: GameProps['services']): LazuliServices =>
  useMemo(
    () => ({ store: openStore(LAZULI_STORE), feedback: createLazuliFeedback(audio), seedSource }),
    [openStore, audio, seedSource],
  );

export default function LazuliGame({ services, onExit }: GameProps) {
  const { store, feedback, seedSource } = useLazuliServices(services);
  const game = useGame({ config: CONFIG, store, seedSource });
  const { state } = game;
  const [settings, updateSettings] = useSettings(store);
  const [arcadeSettings, updateArcadeSettings] = useArcadeSettings(services.settings);
  const reducedMotion = useReducedMotion();
  const playing = state.status === 'playing';

  const gridRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const coinRef = useRef<HTMLSpanElement>(null);
  const effectsRef = useRef<EffectsHandle>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);

  const announce = useCallback((message: string) => {
    const region = liveRef.current;
    if (!region) return;
    region.textContent = '';
    window.setTimeout(() => {
      region.textContent = message;
    }, 40);
  }, []);

  const cursorApi = usePlacementCursor(state.board, state.tray);
  const { cursor } = cursorApi;

  const placePiece = (piece: TrayPiece, origin: Position) => {
    game.place(piece.id, origin);
    cursorApi.clear();
    if (!settings.onboarded) updateSettings({ onboarded: true });
  };

  const selectPiece = (piece: TrayPiece, source: SelectSource) => {
    if (!playing) return;
    const deselect = cursor?.piece.id === piece.id;
    feedback.cue('select');
    cursorApi.select(piece, source);
    if (!deselect) gridRef.current?.focus({ preventScroll: true });
  };

  const drag = usePieceDrag({
    board: state.board,
    enabled: playing,
    reducedMotion,
    gridRef,
    onPick: () => {
      feedback.cue('pick');
      cursorApi.clear();
    },
    onDrop: placePiece,
    onCancel: () => {
      feedback.cue('invalid');
    },
    onSelect: selectPiece,
  });

  const dragView = drag.view;
  const activePiece = dragView ? (dragView.returning ? null : dragView.piece) : (cursor?.piece ?? null);
  const activeOrigin = dragView ? dragView.origin : (cursor?.origin ?? null);

  const preview = useMemo((): BoardPreview | null => {
    if (!activePiece || !activeOrigin) return null;
    const result = previewPlacement(state.board, activePiece.shape, activeOrigin, activePiece.gem);
    return { gem: activePiece.gem, cells: result.cells, valid: result.valid, lines: result.lines };
  }, [state.board, activePiece, activeOrigin]);

  const mood = useMascotMood(state, activePiece !== null);

  useGameEvents({
    event: state.lastEvent,
    cols: CONFIG.cols,
    feedback,
    effectsRef,
    gridRef,
    frameRef,
    coinRef,
    announce,
  });

  /* ---------- keyboard and tap placement ---------- */

  const commitCursor = () => {
    if (!cursor) return;
    if (canPlace(state.board, cursor.piece.shape, cursor.origin)) {
      placePiece(cursor.piece, cursor.origin);
    } else {
      feedback.cue('invalid');
      announce('Não cabe aqui. Mova a peça para um espaço livre.');
    }
  };

  const cancelCursor = () => {
    if (!cursor) return;
    cursorApi.clear();
    announce('Seleção cancelada.');
  };

  const onGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!cursor) return;
    const arrow = ARROWS[event.key];
    if (arrow) {
      event.preventDefault();
      const next = clampOrigin(state.board, cursor.piece.shape, {
        col: cursor.origin.col + arrow.col,
        row: cursor.origin.row + arrow.row,
      });
      cursorApi.moveTo(next);
      const fits = canPlace(state.board, cursor.piece.shape, next);
      announce(`Coluna ${next.col + 1}, linha ${next.row + 1}${fits ? '' : ', não cabe'}.`);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      commitCursor();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelCursor();
    }
  };

  const onGridPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!cursor || !playing) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const cell = rect.width / state.board.cols;
    const tapped = {
      col: Math.floor((event.clientX - rect.left) / cell),
      row: Math.floor((event.clientY - rect.top) / cell),
    };
    const onGhost = footprint(cursor.piece.shape, cursor.origin).some((position) => samePosition(position, tapped));
    if (onGhost && canPlace(state.board, cursor.piece.shape, cursor.origin)) {
      placePiece(cursor.piece, cursor.origin);
      return;
    }
    const { width, height } = cursor.piece.shape;
    cursorApi.moveTo({ col: tapped.col - Math.floor((width - 1) / 2), row: tapped.row - Math.floor((height - 1) / 2) });
    feedback.cue('select');
  };

  /* ---------- dialogs ---------- */

  const [confirmRestart, setConfirmRestart] = useState(false);
  const [overShownSeq, setOverShownSeq] = useState<number | null>(null);
  const [overDismissedSeq, setOverDismissedSeq] = useState<number | null>(null);

  useEffect(() => {
    if (state.status !== 'over') return;
    const seq = state.eventSeq;
    const timer = window.setTimeout(() => {
      setOverShownSeq(seq);
    }, GAME_OVER_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [state.status, state.eventSeq]);

  const gameOverOpen =
    state.status === 'over' && overShownSeq === state.eventSeq && overDismissedSeq !== state.eventSeq;

  const restart = () => {
    setConfirmRestart(false);
    cursorApi.clear();
    game.restart();
  };

  const requestRestart = () => {
    if (state.status === 'over' || state.moves === 0) restart();
    else setConfirmRestart(true);
  };

  const price = rerollPrice(CONFIG, state);
  const affordable = canAffordReroll(CONFIG, state);
  const reroll = () => {
    if (!affordable) return;
    cursorApi.clear();
    game.reroll();
  };

  /* ---------- global shortcuts: 1-3 pick a piece, Esc cancels ---------- */

  const dialogOpen = gameOverOpen || confirmRestart;
  const onWindowKeyDown = useEffectEvent((event: globalThis.KeyboardEvent) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || dialogOpen) return;
    const slot = Number.parseInt(event.key, 10) - 1;
    if (slot >= 0 && slot < state.tray.length) {
      const piece = state.tray[slot];
      if (piece && playing) {
        event.preventDefault();
        selectPiece(piece, 'keyboard');
      }
    } else if (event.key === 'Escape') {
      cancelCursor();
    }
  });

  useEffect(() => {
    const listener = (event: globalThis.KeyboardEvent) => {
      onWindowKeyDown(event);
    };
    window.addEventListener('keydown', listener);
    return () => {
      window.removeEventListener('keydown', listener);
    };
  }, []);

  /* ---------- render ---------- */

  const hint = cursor
    ? cursor.source === 'keyboard'
      ? 'Setas movem · Enter coloca · Esc cancela'
      : 'Toque para mover · toque na sombra para colocar'
    : !settings.onboarded && state.moves === 0 && playing
      ? 'Arraste uma peça até o tabuleiro'
      : null;

  const filled = Math.round(fillRatio(state.board) * state.board.cells.length);

  return (
    <div
      className={cx(theme.theme, styles.app)}
      onPointerDownCapture={() => {
        services.audio.unlock();
      }}
      onKeyDownCapture={() => {
        services.audio.unlock();
      }}
      onContextMenu={(event) => {
        event.preventDefault();
      }}
    >
      <main
        className={styles.stage}
        style={{ '--cols': CONFIG.cols, '--rows': CONFIG.rows, '--tray-size': CONFIG.traySize }}
      >
        <h1 className="sr-only">Lazuli Blocks</h1>
        <Hud
          mood={mood}
          coins={state.coins}
          score={state.score}
          best={state.best}
          sound={arcadeSettings.sound}
          reducedMotion={reducedMotion}
          coinRef={coinRef}
          onToggleSound={() => {
            updateArcadeSettings({ sound: !arcadeSettings.sound });
          }}
          onRestart={requestRestart}
          onExit={onExit}
        />
        <BoardView
          board={state.board}
          preview={preview}
          danger={playing && fillRatio(state.board) >= 0.7}
          placing={cursor !== null}
          gridRef={gridRef}
          frameRef={frameRef}
          label={`Tabuleiro ${CONFIG.cols} por ${CONFIG.rows}, ${countLabel(filled, 'casa ocupada', 'casas ocupadas')}`}
          describedBy={HELP_ID}
          onGridPointerDown={onGridPointerDown}
          onGridKeyDown={onGridKeyDown}
        />
        <Tray
          tray={state.tray}
          board={state.board}
          playing={playing}
          liftedId={dragView?.piece.id ?? null}
          selectedId={cursor?.piece.id ?? null}
          rerollPrice={price}
          canReroll={affordable}
          hint={hint}
          helpId={HELP_ID}
          bind={drag.bind}
          onReroll={reroll}
        />
        <p id={HELP_ID} className="sr-only">
          Arraste uma peça da bandeja até o tabuleiro. Pelo teclado, escolha a peça com Enter ou com as teclas 1, 2 e
          3, mova com as setas e coloque com Enter. Linhas e colunas completas viram moedas.
        </p>
      </main>

      <DragLayer view={dragView} layerRef={drag.attachLayer} />
      <EffectsLayer ref={effectsRef} reducedMotion={reducedMotion} />

      <GameOverDialog
        open={gameOverOpen}
        score={state.score}
        best={state.best}
        runCoins={state.runCoins}
        rerollPrice={price}
        canReroll={affordable}
        onReroll={reroll}
        onRestart={restart}
        onDismiss={() => {
          setOverDismissedSeq(state.eventSeq);
        }}
      />
      <RestartDialog
        open={confirmRestart}
        score={state.score}
        onConfirm={restart}
        onCancel={() => {
          setConfirmRestart(false);
        }}
      />

      <p ref={liveRef} className="sr-only" aria-live="polite" aria-atomic="true" />
    </div>
  );
}
