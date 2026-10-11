import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { samePosition, type Position } from '@shared/domain/grid';
import type { GameProps } from '@shared/ui/arcade';
import { cx } from '@shared/ui/cx';
import { usePointerDrag } from '@shared/ui/drag/usePointerDrag';
import { useAnnouncer } from '@shared/ui/hooks/useAnnouncer';
import { useArcadeSettings } from '@shared/ui/hooks/useArcadeSettings';
import { useDocumentVisible } from '@shared/ui/hooks/useDocumentVisible';
import { useReducedMotion } from '@shared/ui/hooks/useReducedMotion';
import { createMatchStore } from '../application/matchStore';
import type { EmpilhaServices } from '../application/ports';
import { EMPILHA_STORE } from '../application/stats';
import { loadTournament, saveTournament } from '../application/tournamentStore';
import { useOpponentClock } from '../application/useOpponentClock';
import {
  DEFAULT_RULES,
  freeCells,
  isFreeCell,
  positionsWhere,
  stackAt,
  type MatchState,
  type PlayerPlacedEvent,
  type Character,
  getCharacter,
  getCharacterByLevel,
  advanceTournament,
  createTournament,
  getActiveTournamentMatch,
  ROUND_NAMES,
} from '../domain';
import { createEmpilhaFeedback } from '../infrastructure/empilhaFeedback';
import { BoardView } from './components/BoardView';
import { Countdown } from './components/Countdown';
import { DragLayer } from './components/DragLayer';
import { EffectsLayer, type EmpilhaEffects } from './components/EffectsLayer';
import { HelpDialog, PauseDialog, ResultDialog } from './components/EmpilhaDialogs';
import { OpponentLiveView } from './components/OpponentLiveView';
import { ScoreRace } from './components/ScoreRace';
import { TopBar } from './components/TopBar';
import { TournamentBracket } from './components/TournamentBracket';
import { PlayerTray } from './components/Trays';
import { countLabel, describeStack, pointsLabel, RESULT_COPY, tileCount } from './copy';
import styles from './EmpilhaGame.module.css';
import { floorCenter, HEADROOM, LAYER, measureBoard, SQUASH, stackSize } from './geometry';
import { useCountdown } from './hooks/useCountdown';
import { useResolutionPlayer } from './hooks/useResolutionPlayer';
import { cellAtPoint, centralFreeCell, dropTarget, isArrowKey, nextCellInDirection } from './navigation';
import theme from './styles/theme.module.css';

const RULES = DEFAULT_RULES;
const HELP_ID = 'empilha-help';

type Menu = 'pause' | 'help' | null;

interface Selection {
  readonly slot: number;
  readonly cursor: Position;
  readonly source: 'pointer' | 'keyboard';
}

const useEmpilhaServices = ({ openStore, audio, seedSource }: GameProps['services']): EmpilhaServices =>
  useMemo(
    () => ({ store: openStore(EMPILHA_STORE), feedback: createEmpilhaFeedback(audio), seedSource }),
    [openStore, audio, seedSource],
  );

const describeMove = (event: PlayerPlacedEvent): string => {
  const { resolution, unlocked, dealt } = event.outcome;
  const parts: string[] = [];
  const merges = resolution.steps.filter((step) => step.type === 'merge');
  const clears = resolution.steps.filter((step) => step.type === 'clear');
  if (merges.length === 0 && clears.length === 0) parts.push('Pilha colocada.');
  if (merges.length > 0) parts.push(`${countLabel(resolution.tilesMoved, 'peça juntou', 'peças juntaram')} a vizinhas.`);
  for (const clear of clears) {
    parts.push(`Limpou ${tileCount(clear.color, clear.count)}: mais ${pointsLabel(clear.points)}${clear.chain > 1 ? `, combo ${clear.chain}` : ''}.`);
  }
  if (unlocked.length > 0) parts.push('A casa com cadeado foi liberada.');
  if (dealt) parts.push('Novas pilhas na bandeja.');
  return parts.join(' ');
};

export default function EmpilhaGame({ services, onExit }: GameProps) {
  const { store, feedback, seedSource } = useEmpilhaServices(services);
  const [matchStore] = useState(() => createMatchStore({ rules: RULES, store, seedSource }));
  const { match, stats } = useSyncExternalStore(matchStore.subscribe, matchStore.getState, matchStore.getState);
  const [settings, updateSettings] = useArcadeSettings(services.settings);
  const reducedMotion = useReducedMotion();
  const visible = useDocumentVisible();
  const [menu, setMenu] = useState<Menu>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [liveRef, announce] = useAnnouncer();

  const [tournament, setTournament] = useState(() => loadTournament(store));
  const [isTournamentMode, setIsTournamentMode] = useState(false);
  const [showBracket, setShowBracket] = useState(false);

  const boardRef = useRef<HTMLDivElement>(null);
  const playerFillRef = useRef<HTMLDivElement>(null);
  const rivalFillRef = useRef<HTMLDivElement>(null);
  const effectsRef = useRef<EmpilhaEffects>(null);

  const activeTournamentMatch = isTournamentMode ? getActiveTournamentMatch(tournament) : null;
  const currentCharacter: Character = useMemo(() => {
    if (isTournamentMode && activeTournamentMatch?.competitor2.characterId) {
      return getCharacter(activeTournamentMatch.competitor2.characterId);
    }
    return getCharacterByLevel(match.level);
  }, [isTournamentMode, activeTournamentMatch, match.level]);

  const { cols, rows } = match.player.board;
  const measure = useCallback(() => (boardRef.current ? measureBoard(boardRef.current, cols, rows) : null), [cols, rows]);
  const barTarget = useCallback(() => {
    const rect = playerFillRef.current?.getBoundingClientRect();
    return rect ? { x: rect.right - 16, y: rect.top + rect.height / 2 } : null;
  }, []);

  const countdown = useCountdown(match.status === 'playing', (value) => {
    feedback.cue(value === 0 ? 'go' : 'tick');
    if (value === 0) announce('Valendo! Arraste uma pilha até uma casa vazia.');
  });
  const { playback, play, reset } = useResolutionPlayer({ effectsRef, measure, barTarget, feedback, reducedMotion });

  const live = match.status === 'playing' && !countdown.blocking;
  const canAct = live && !playback.busy && menu === null && !showBracket;
  const board = playback.board ?? match.player.board;
  const showResult = match.status !== 'playing' && !playback.busy;

  const celebrate = (ended: MatchState) => {
    feedback.cue(ended.status === 'won' ? 'win' : 'lose');
    if (ended.endReason) announce(`${RESULT_COPY[ended.endReason].title} ${RESULT_COPY[ended.endReason].text}`);

    if (isTournamentMode) {
      const nextTournament = advanceTournament(
        tournament,
        ended.status === 'won',
        ended.player.score,
        ended.opponent.score,
      );
      setTournament(nextTournament);
      saveTournament(store, nextTournament);
      window.setTimeout(() => {
        setShowBracket(true);
      }, 1200);
    }
  };

  useOpponentClock({
    active: live && menu === null && visible && !showBracket,
    profile: currentCharacter.bot,
    turn: match.opponent.moves,
    onTurn: () => {
      const before = matchStore.getState().match;
      const after = matchStore.dispatch({ type: 'opponentTurn' }).match;
      const event = after.lastEvent;
      if (event?.type === 'opponentPlaced' && event.seq > before.eventSeq && event.clears > 0) {
        feedback.cue('rivalScore');
        const rect = rivalFillRef.current?.getBoundingClientRect();
        if (rect) {
          effectsRef.current?.floatText({ at: { x: rect.right - 28, y: rect.bottom + 16 }, text: `+${event.points}`, tone: 'rival' });
        }
        announce(`${currentCharacter.name} marcou ${pointsLabel(event.points)}.`);
      }
      if (before.status === 'playing' && after.status !== 'playing') celebrate(after);
    },
  });

  const place = (slot: number, at: Position): boolean => {
    if (!canAct) return false;
    const before = matchStore.getState().match;
    const after = matchStore.dispatch({ type: 'place', slot, at }).match;
    if (after === before) {
      feedback.cue('invalid');
      return false;
    }
    setSelection(null);
    feedback.cue('drop');
    const event = after.lastEvent;
    if (event?.type !== 'playerPlaced') return true;
    void play(event).then(() => {
      announce(describeMove(event));
      const metrics = measure();
      if (event.outcome.unlocked.length > 0) {
        feedback.cue('unlock');
        for (const position of event.outcome.unlocked) {
          if (!metrics) break;
          const center = floorCenter(metrics, position);
          effectsRef.current?.ring(center, metrics.hw);
          effectsRef.current?.floatText({ at: center, text: 'Liberada!', tone: 'unlock' });
        }
      }
      if (after.status !== 'playing') celebrate(after);
    });
    return true;
  };

  const drag = usePointerDrag<number, Position>({
    enabled: canAct,
    reducedMotion,
    measure: (slot) => {
      const metrics = measure();
      const stack = match.player.tray[slot];
      return metrics && stack ? stackSize(metrics, stack.tiles.length) : null;
    },
    snap: (_slot, rect) => {
      const metrics = measure();
      if (!metrics) return null;
      return dropTarget(metrics, match.player.board, { x: rect.left + rect.width / 2, y: rect.top + rect.height - metrics.hh });
    },
    sameTarget: samePosition,
    sameItem: (a, b) => a === b,
    onPick: () => {
      feedback.cue('pick');
      setSelection(null);
    },
    onDrop: (slot, at) => {
      place(slot, at);
    },
    onCancel: () => {
      feedback.cue('invalid');
    },
    onTap: (slot, source) => {
      toggleSelection(slot, source);
    },
  });

  const toggleSelection = (slot: number, source: 'pointer' | 'keyboard') => {
    if (!canAct || !match.player.tray[slot]) return;
    if (selection?.slot === slot) {
      setSelection(null);
      return;
    }
    const cursor = centralFreeCell(match.player.board);
    if (!cursor) return;
    feedback.cue('select');
    setSelection({ slot, cursor, source });
    if (source === 'keyboard') boardRef.current?.focus({ preventScroll: true });
    announce(
      source === 'keyboard'
        ? 'Pilha escolhida. Use as setas para escolher a casa e Enter para colocar.'
        : 'Pilha escolhida. Toque numa casa vazia para colocar.',
    );
  };

  const onBoardPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!selection || !canAct) return;
    const metrics = measure();
    if (!metrics) return;
    const cell = cellAtPoint(metrics, match.player.board, { x: event.clientX, y: event.clientY });
    if (!cell) return;
    if (isFreeCell(match.player.board, cell)) {
      place(selection.slot, cell);
      return;
    }
    feedback.cue('invalid');
  };

  const describeCell = (position: Position): string => {
    const stack = stackAt(board, position);
    const where = `Linha ${position.row + 1}, coluna ${position.col + 1}`;
    if (stack === null) return `${where}: bloqueada.`;
    return stack.length === 0 ? `${where}: vazia.` : `${where}: ${describeStack(stack)}.`;
  };

  const onBoardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!selection) return;
    if (isArrowKey(event.key)) {
      event.preventDefault();
      const cursor = nextCellInDirection(board, selection.cursor, event.key);
      setSelection({ ...selection, cursor });
      announce(describeCell(cursor));
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!place(selection.slot, selection.cursor)) announce('Essa casa não está livre.');
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setSelection(null);
      announce('Seleção cancelada.');
    }
  };

  const startMatch = (level: number) => {
    reset();
    setSelection(null);
    setMenu(null);
    matchStore.dispatch({ type: 'newMatch', level, seed: seedSource() });
    countdown.start();
  };

  const startTournamentMatch = () => {
    setShowBracket(false);
    setIsTournamentMode(true);
    const tourLevel = tournament.currentRound * 2 + 1;
    startMatch(tourLevel);
  };

  const resetTournament = () => {
    const fresh = createTournament(tournament.trophiesCount);
    setTournament(fresh);
    saveTournament(store, fresh);
  };

  const dialogOpen = menu !== null || showResult || showBracket;
  const onWindowKeyDown = useEffectEvent((event: globalThis.KeyboardEvent) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || dialogOpen) return;
    const slot = Number.parseInt(event.key, 10) - 1;
    if (slot >= 0 && slot < match.player.tray.length) {
      event.preventDefault();
      toggleSelection(slot, 'keyboard');
    } else if (event.key === 'Escape') {
      event.preventDefault();
      if (selection) {
        setSelection(null);
        announce('Seleção cancelada.');
      } else {
        setMenu('pause');
      }
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

  const free = freeCells(match.player.board).length;
  const locked = positionsWhere(match.player.board, (cell) => cell.kind === 'locked');
  const unlockAt = locked.length > 0 ? RULES.layout.unlockAt[0] ?? null : null;
  const firstMove = stats.wins + stats.losses === 0 && match.player.moves === 0;
  const hint = selection
    ? selection.source === 'keyboard'
      ? 'Setas movem · Enter coloca · Esc cancela'
      : 'Toque numa casa vazia para colocar'
    : firstMove && live
      ? 'Arraste uma pilha até uma casa vazia'
      : null;
  const draggedTiles = drag.view ? (match.player.tray[drag.view.item]?.tiles ?? null) : null;

  return (
    <div
      className={cx(theme.theme, styles.app)}
      style={{ '--squash': SQUASH, '--layer': LAYER, '--headroom': HEADROOM }}
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
      <main className={styles.stage}>
        <h1 className="sr-only">Empilha</h1>
        <TopBar
          level={match.level}
          onExit={onExit}
          onMenu={() => {
            setMenu('pause');
          }}
          isTournament={isTournamentMode}
          tournamentRoundName={ROUND_NAMES[tournament.currentRound]}
          onOpenTournament={() => {
            setShowBracket(true);
          }}
        />

        <ScoreRace
          player={match.player.score - Math.round(playback.pending)}
          rival={match.opponent.score}
          target={match.target}
          playerFillRef={playerFillRef}
          rivalFillRef={rivalFillRef}
          character={currentCharacter}
        />

        <OpponentLiveView
          character={currentCharacter}
          opponent={match.opponent}
          lastEvent={match.lastEvent}
          isLive={live}
        />

        <div className={styles.boardWrap}>
          <BoardView
            board={board}
            target={drag.view?.target ?? null}
            cursor={selection?.source === 'keyboard' ? selection.cursor : null}
            highlightFree={selection?.source === 'pointer'}
            boardRef={boardRef}
            label={`Seu tabuleiro: ${countLabel(free, 'casa livre', 'casas livres')}`}
            describedBy={HELP_ID}
            interactive={selection !== null}
            onPointerDown={onBoardPointerDown}
            onKeyDown={onBoardKeyDown}
          />
        </div>

        <div className={styles.hintRow}>
          {hint && (
            <p key={hint} className={styles.hint} aria-hidden="true">
              {hint}
            </p>
          )}
        </div>

        <PlayerTray
          tray={match.player.tray}
          enabled={canAct}
          selectedSlot={selection?.slot ?? null}
          liftedSlot={drag.view?.item ?? null}
          helpId={HELP_ID}
          bind={drag.bind}
        />
        <p id={HELP_ID} className="sr-only">
          Arraste uma pilha até uma casa vazia. Pelo teclado, escolha a pilha com as teclas 1, 2 e 3, mova com as setas e
          coloque com Enter. Pilhas vizinhas com o mesmo símbolo no topo se juntam; dez iguais viram pontos. Esc pausa.
        </p>
      </main>

      <Countdown value={countdown.value} />
      <DragLayer view={drag.view} tiles={draggedTiles} hw={drag.view ? drag.view.width / 2 : 0} layerRef={drag.attachLayer} />
      <EffectsLayer ref={effectsRef} />

      {showBracket && (
        <TournamentBracket
          tournament={tournament}
          onPlayMatch={startTournamentMatch}
          onResetTournament={resetTournament}
          onClose={() => { setShowBracket(false); }}
        />
      )}

      <PauseDialog
        open={menu === 'pause'}
        sound={settings.sound}
        onResume={() => {
          setMenu(null);
        }}
        onToggleSound={() => {
          updateSettings({ sound: !settings.sound });
        }}
        onHelp={() => {
          setMenu('help');
        }}
        onRestart={() => {
          startMatch(match.level);
        }}
        onExit={onExit}
      />

      <HelpDialog
        open={menu === 'help'}
        target={match.target}
        clearAt={RULES.settle.clearAt}
        unlockAt={unlockAt}
        onClose={() => {
          setMenu('pause');
        }}
      />

      {match.endReason && !isTournamentMode && (
        <ResultDialog
          open={showResult && menu === null}
          won={match.status === 'won'}
          reason={match.endReason}
          playerScore={match.player.score}
          rivalScore={match.opponent.score}
          nextLevel={stats.level}
          stats={stats}
          onNext={() => {
            startMatch(stats.level);
          }}
          onExit={onExit}
        />
      )}

      <p ref={liveRef} className="sr-only" aria-live="polite" aria-atomic="true" />
    </div>
  );
}
