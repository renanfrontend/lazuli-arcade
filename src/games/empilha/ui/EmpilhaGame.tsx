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
import { castMember, type CastId } from '@shared/cast/cast';
import { samePosition, type Position } from '@shared/domain/grid';
import type { GameProps } from '@shared/ui/arcade';
import { cx } from '@shared/ui/cx';
import { usePointerDrag } from '@shared/ui/drag/usePointerDrag';
import { useAnnouncer } from '@shared/ui/hooks/useAnnouncer';
import { useArcadeSettings } from '@shared/ui/hooks/useArcadeSettings';
import { useDocumentVisible } from '@shared/ui/hooks/useDocumentVisible';
import { useReducedMotion } from '@shared/ui/hooks/useReducedMotion';
import { createMatchStore } from '../application/matchStore';
import { createTournamentStore, isBracketMatch } from '../application/tournamentStore';
import type { EmpilhaServices } from '../application/ports';
import { EMPILHA_STORE } from '../application/stats';
import { nextOpponent } from '../application/opponents';
import { useOpponentClock } from '../application/useOpponentClock';
import {
  DEFAULT_RULES,
  findRival,
  freeCells,
  nextRival,
  isFreeCell,
  positionsWhere,
  stackAt,
  type MatchState,
  type PlacedEvent,
} from '../domain';
import { createEmpilhaFeedback } from '../infrastructure/empilhaFeedback';
import { BoardView } from './components/BoardView';
import { Bracket } from './components/Bracket';
import { Home } from './components/Home';
import { Countdown } from './components/Countdown';
import { DragLayer } from './components/DragLayer';
import { EffectsLayer, type EmpilhaEffects } from './components/EffectsLayer';
import { HelpDialog, PauseDialog, ResultDialog } from './components/EmpilhaDialogs';
import { ScoreRace } from './components/ScoreRace';
import { TopBar } from './components/TopBar';
import { PlayerTray, RivalTray } from './components/Trays';
import { countLabel, describeStack, pointsLabel, RESULT_COPY, tileCount } from './copy';
import styles from './EmpilhaGame.module.css';
import { floorCenter, HEADROOM, LAYER, measureBoard, SQUASH, stackSize } from './geometry';
import { useCountdown } from './hooks/useCountdown';
import { useResolutionPlayer, type TrayFlight } from './hooks/useResolutionPlayer';
import { cellAtPoint, centralFreeCell, dropTarget, isArrowKey, nextCellInDirection } from './navigation';
import theme from './styles/theme.module.css';

const RULES = DEFAULT_RULES;
const HELP_ID = 'empilha-help';

type Menu = 'pause' | 'help' | null;
type View = 'home' | 'bracket' | 'match';

interface Selection {
  readonly slot: number;
  readonly cursor: Position;
  readonly source: 'pointer' | 'keyboard';
}

/** Composition root of the game: arcade services in, Empilha adapters out. */
const useEmpilhaServices = ({ openStore, audio, seedSource }: GameProps['services']): EmpilhaServices =>
  useMemo(
    () => ({ store: openStore(EMPILHA_STORE), feedback: createEmpilhaFeedback(audio), seedSource }),
    [openStore, audio, seedSource],
  );

/** What a screen reader hears after a move settles. */
const describeMove = (event: PlacedEvent, who: string): string => {
  const { resolution, unlocked, handoff } = event;
  const parts: string[] = [];
  const merges = resolution.steps.filter((step) => step.type === 'merge');
  const clears = resolution.steps.filter((step) => step.type === 'clear');
  const subject = event.by === 'player' ? '' : `${who}: `;
  if (merges.length === 0 && clears.length === 0) parts.push(event.by === 'player' ? 'Pilha colocada.' : 'colocou uma pilha.');
  if (merges.length > 0) parts.push(`${countLabel(resolution.tilesMoved, 'peça juntou', 'peças juntaram')} a vizinhas.`);
  for (const clear of clears) {
    parts.push(`Limpou ${tileCount(clear.color, clear.count)}: mais ${pointsLabel(clear.points)}${clear.chain > 1 ? `, combo ${clear.chain}` : ''}.`);
  }
  if (unlocked.length > 0) parts.push('A casa com cadeado foi liberada.');
  if (handoff) parts.push(event.by === 'player' ? `Vez de ${who}.` : 'Sua vez.');
  return `${subject}${parts.join(' ')}`;
};

export default function EmpilhaGame({ services, onExit }: GameProps) {
  const { store, feedback, seedSource } = useEmpilhaServices(services);
  const [matchStore] = useState(() => createMatchStore({ rules: RULES, store, seedSource }));
  const { match, stats } = useSyncExternalStore(matchStore.subscribe, matchStore.getState, matchStore.getState);
  const [tournaments] = useState(() => createTournamentStore(store, RULES));
  const tournament = useSyncExternalStore(tournaments.subscribe, tournaments.getState, tournaments.getState);
  const [view, setView] = useState<View>('home');
  const [settings, updateSettings] = useArcadeSettings(services.settings);
  const reducedMotion = useReducedMotion();
  const visible = useDocumentVisible();
  const [menu, setMenu] = useState<Menu>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [liveRef, announce] = useAnnouncer();

  const boardRef = useRef<HTMLDivElement>(null);
  const playerFillRef = useRef<HTMLDivElement>(null);
  const rivalFillRef = useRef<HTMLDivElement>(null);
  const effectsRef = useRef<EmpilhaEffects>(null);

  const { cols, rows } = match.board;
  const rival = findRival(match.opponentId);
  const rivalName = castMember(match.opponentId).name;
  const rivalSlotsRef = useRef<(HTMLDivElement | null)[]>([]);
  const measure = useCallback(() => (boardRef.current ? measureBoard(boardRef.current, cols, rows) : null), [cols, rows]);
  const barTarget = useCallback((by: 'player' | 'opponent') => {
    const rect = (by === 'player' ? playerFillRef : rivalFillRef).current?.getBoundingClientRect();
    if (by === 'opponent') return rect ? { x: rect.left + 16, y: rect.top + rect.height / 2 } : null;
    return rect ? { x: rect.right - 16, y: rect.top + rect.height / 2 } : null;
  }, []);

  const countdown = useCountdown(false, (value) => {
    feedback.cue(value === 0 ? 'go' : 'tick');
    if (value === 0) announce('Valendo! Arraste uma pilha até uma casa vazia.');
  });
  const { playback, play, reset } = useResolutionPlayer({ effectsRef, measure, barTarget, feedback, reducedMotion });

  const live = view === 'match' && match.status === 'playing' && !countdown.blocking;
  const canAct = live && match.turn === 'player' && !playback.busy && menu === null;
  const board = playback.board ?? match.board;
  const showResult = view === 'match' && match.status !== 'playing' && !playback.busy;
  const bracketMatch = tournament !== null && isBracketMatch(tournament.save, match);

  // A finished bracket match counts once; winning the final earns a trophy.
  useEffect(() => {
    if (match.status === 'playing' || playback.busy) return;
    if (tournaments.settle(match)) matchStore.awardTitle();
  }, [match, playback.busy, tournaments, matchStore]);

  const celebrate = (ended: MatchState) => {
    feedback.cue(ended.status === 'won' ? 'win' : 'lose');
    if (ended.endReason) announce(`${RESULT_COPY[ended.endReason].title} ${RESULT_COPY[ended.endReason].text}`);
  };

  /* ---------- replaying a move ---------- */

  const settleMove = (event: PlacedEvent, after: MatchState, flight: TrayFlight | null) => {
    void play(event, flight).then(() => {
      announce(describeMove(event, rivalName));
      const metrics = measure();
      if (event.unlocked.length > 0) {
        feedback.cue('unlock');
        for (const position of event.unlocked) {
          if (!metrics) break;
          const center = floorCenter(metrics, position);
          effectsRef.current?.ring(center, metrics.hw);
          effectsRef.current?.floatText({ at: center, text: 'Liberada!', tone: 'unlock' });
        }
      }
      if (after.status !== 'playing') celebrate(after);
    });
  };

  /* ---------- the rival ---------- */

  /** Copies the rival's stacks before its move: the chosen one is gone from the tray once the move lands. */
  const captureTray = (): readonly (TrayFlight | null)[] =>
    rivalSlotsRef.current.map((slot) => {
      const stack = slot?.firstElementChild;
      if (!slot || !(stack instanceof HTMLElement)) return null;
      const clone = stack.cloneNode(true) as HTMLElement;
      // The tray's entrance animation would replay on the copy and make it fade in mid-flight.
      clone.style.animation = 'none';
      return { clone, rect: stack.getBoundingClientRect() };
    });

  // Mid-tray placements come quicker than the first thought of a turn.
  const midTray = match.opponent.tray.some((slot) => slot === null);
  useOpponentClock({
    active: live && match.turn === 'opponent' && !playback.busy && menu === null && visible,
    profile: { ...rival.bot, thinkMs: midTray ? rival.bot.thinkMs * 0.55 : rival.bot.thinkMs },
    turn: match.eventSeq,
    onTurn: () => {
      const flights = captureTray();
      const before = matchStore.getState().match;
      const after = matchStore.dispatch({ type: 'opponentTurn' }).match;
      const event = after.lastEvent;
      if (event?.type !== 'placed' || event.by !== 'opponent' || event.seq <= before.eventSeq) return;
      if (event.resolution.clears > 0) feedback.cue('rivalScore');
      settleMove(event, after, flights[event.slot] ?? null);
    },
  });

  /* ---------- placing ---------- */

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
    if (event?.type === 'placed') settleMove(event, after, null);
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
      // The bottom tile's centre is where the stack touches down.
      return dropTarget(metrics, match.board, { x: rect.left + rect.width / 2, y: rect.top + rect.height - metrics.hh });
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

  /* ---------- tap and keyboard placement ---------- */

  const toggleSelection = (slot: number, source: 'pointer' | 'keyboard') => {
    if (!canAct || !match.player.tray[slot]) return;
    if (selection?.slot === slot) {
      setSelection(null);
      return;
    }
    const cursor = centralFreeCell(match.board);
    if (!cursor) return;
    feedback.cue('select');
    setSelection({ slot, cursor, source });
    // Keyboard users steer a cursor on the focused board; pointer users just tap a highlighted cell.
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
    const cell = cellAtPoint(metrics, match.board, { x: event.clientX, y: event.clientY });
    if (!cell) return;
    if (isFreeCell(match.board, cell)) {
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

  /* ---------- match flow ---------- */

  const startMatch = (opponentId: CastId, inTournament = false) => {
    reset();
    setSelection(null);
    setMenu(null);
    const { match: fresh } = matchStore.dispatch({ type: 'newMatch', opponentId, seed: seedSource() });
    tournaments.beginMatch(inTournament ? fresh.eventSeq : null);
    setView('match');
    countdown.start();
  };

  const dialogOpen = menu !== null || showResult;
  const onWindowKeyDown = useEffectEvent((event: globalThis.KeyboardEvent) => {
    if (view !== 'match' || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || dialogOpen) return;
    const slot = Number.parseInt(event.key, 10) - 1;
    if (slot >= 0 && slot < match.player.tray.length) {
      event.preventDefault();
      toggleSelection(slot, 'keyboard');
    } else if (event.key === 'Escape') {
      // Without this, the same keypress would reach the pause dialog it opens and close it again.
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

  /* ---------- render ---------- */

  const free = freeCells(match.board).length;
  const locked = positionsWhere(match.board, (cell) => cell.kind === 'locked');
  const unlockAt = locked.length > 0 ? RULES.layout.unlockAt[0] ?? null : null;
  const firstMove = stats.wins + stats.losses === 0 && match.player.moves === 0;
  const hint = selection
    ? selection.source === 'keyboard'
      ? 'Setas movem · Enter coloca · Esc cancela'
      : 'Toque numa casa vazia para colocar'
    : live && match.turn === 'opponent'
      ? `Vez de ${rivalName}…`
      : firstMove && live
        ? 'Arraste uma pilha até uma casa vazia'
        : live
          ? `Sua vez · ${countLabel(match.player.tray.filter((slot) => slot !== null).length, 'pilha', 'pilhas')}`
          : null;
  const upcoming = nextOpponent(stats);
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
      {view === 'home' && (
        <Home
          stats={stats}
          resumable={match.status === 'playing' && match.player.moves + match.opponent.moves > 0 ? match.opponentId : null}
          tournament={tournament}
          onResume={() => {
            setView('match');
            countdown.start();
          }}
          onPlayRival={(id) => {
            startMatch(id);
          }}
          onTournament={() => {
            if (!tournament) tournaments.start(seedSource());
            setView('bracket');
          }}
          onExit={onExit}
        />
      )}
      {view === 'bracket' && tournament && (
        <Bracket
          session={tournament}
          onPlay={() => {
            const rivalId = nextRival(tournament.tournament);
            if (rivalId) startMatch(rivalId, true);
          }}
          onNew={() => {
            tournaments.start(seedSource());
          }}
          onBack={() => {
            setView('home');
          }}
        />
      )}
      <main className={styles.stage} hidden={view !== 'match'}>
        <h1 className="sr-only">Empilha</h1>
        <TopBar
          rival={rivalName}
          onExit={onExit}
          onMenu={() => {
            setMenu('pause');
          }}
        />
        <ScoreRace
          player={match.player.score - (playback.by === 'player' ? Math.round(playback.pending) : 0)}
          rival={match.opponent.score - (playback.by === 'opponent' ? Math.round(playback.pending) : 0)}
          target={match.target}
          rivalId={match.opponentId}
          rivalMood={match.status === 'won' ? 'sad' : match.status === 'lost' ? 'happy' : match.turn === 'opponent' ? 'think' : 'idle'}
          turn={match.turn}
          playerFillRef={playerFillRef}
          rivalFillRef={rivalFillRef}
        />
        <RivalTray
          tray={match.opponent.tray}
          active={match.turn === 'opponent' && match.status === 'playing'}
          slotRef={(slot) => (element) => {
            rivalSlotsRef.current[slot] = element;
          }}
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
          waiting={match.turn !== 'player' && match.status === 'playing'}
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
          startMatch(match.opponentId, bracketMatch);
        }}
        onMenu={() => {
          setMenu(null);
          setView('home');
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
      {match.endReason && (
        <ResultDialog
          open={showResult && menu === null}
          won={match.status === 'won'}
          reason={match.endReason}
          playerScore={match.player.score}
          rivalScore={match.opponent.score}
          rivalId={match.opponentId}
          rivalLine={match.status === 'won' ? rival.lines.lose : rival.lines.win}
          nextRivalId={match.status === 'won' && upcoming !== match.opponentId ? upcoming : null}
          bracket={bracketMatch}
          stats={stats}
          onNext={() => {
            if (bracketMatch) setView('bracket');
            else startMatch(match.status === 'won' ? upcoming : match.opponentId);
          }}
          onRematch={() => {
            startMatch(match.opponentId);
          }}
          onExit={onExit}
        />
      )}

      <p ref={liveRef} className="sr-only" aria-live="polite" aria-atomic="true" />
    </div>
  );
}
