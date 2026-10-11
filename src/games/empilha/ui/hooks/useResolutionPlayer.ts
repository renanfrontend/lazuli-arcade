import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { Position } from '@shared/domain/grid';
import { stackAt, withStack, type Board, type PlacedEvent, type TileColor } from '../../domain';
import type { EmpilhaFeedback } from '../../application/ports';
import type { EmpilhaEffects } from '../components/EffectsLayer';
import { formatNumber } from '../copy';
import { floorCenter, topFaceCenter, type BoardMetrics, type Point } from '../geometry';

/** A rival's stack captured in its tray just before it left, so it can fly to the board. */
export interface TrayFlight {
  readonly clone: HTMLElement;
  readonly rect: DOMRect;
}

export interface Playback {
  /** Board to draw instead of the real one while a move is being replayed. */
  readonly board: Board | null;
  /** Points already won but not yet shown on the bar (they arrive with the animation). */
  readonly pending: number;
  readonly busy: boolean;
  /** Whose move is being replayed: its bar receives the points. */
  readonly by: 'player' | 'opponent' | null;
}

const IDLE: Playback = { board: null, pending: 0, busy: false, by: null };

/** Delay between tiles leaving one stack, and between tiles popping off a clear. */
const HOP_STAGGER = 60;
const POP_STAGGER = 34;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

const popTile = (board: Board, position: Position): { readonly board: Board; readonly color: TileColor | null } => {
  const stack = stackAt(board, position) ?? [];
  const color = stack.at(-1) ?? null;
  return { board: withStack(board, position, stack.slice(0, -1)), color };
};

const pushTile = (board: Board, position: Position, color: TileColor): Board =>
  withStack(board, position, [...(stackAt(board, position) ?? []), color]);

const height = (board: Board, position: Position) => stackAt(board, position)?.length ?? 0;

interface PlayerDeps {
  readonly effectsRef: RefObject<EmpilhaEffects | null>;
  readonly measure: () => BoardMetrics | null;
  /** Where cleared points fly to: the end of the mover's bar. */
  readonly barTarget: (by: 'player' | 'opponent') => Point | null;
  readonly feedback: EmpilhaFeedback;
  readonly reducedMotion: boolean;
}

/**
 * Replays a placement step by step: tiles hop one by one along the merge path, cleared runs
 * burst into points that fly to the score bar, and the bar fills as they arrive. The domain
 * already holds the final state; this only animates the way there.
 */
export const useResolutionPlayer = ({ effectsRef, measure, barTarget, feedback, reducedMotion }: PlayerDeps) => {
  const [playback, setPlayback] = useState<Playback>(IDLE);
  const runRef = useRef(0);

  useEffect(
    () => () => {
      runRef.current += 1;
    },
    [],
  );

  const play = useCallback(
    async (event: PlacedEvent, flight?: TrayFlight | null): Promise<void> => {
      const run = ++runRef.current;
      const alive = () => runRef.current === run;
      const { landed, resolution, by } = event;
      const effects = effectsRef.current;
      const metrics = measure();
      const animated = !reducedMotion && effects !== null && metrics !== null;
      if (!animated || (resolution.steps.length === 0 && !flight)) {
        setPlayback(IDLE);
        return;
      }

      let board = flight ? withStack(landed, event.at, []) : landed;
      let pending = resolution.points;
      let hops = 0;
      const show = () => {
        if (alive()) setPlayback({ board, pending, busy: true, by });
      };
      show();
      if (flight) {
        feedback.cue('pick');
        await effects.fly({ ...flight, to: floorCenter(metrics, event.at), hw: metrics.hw });
        if (!alive()) return;
        feedback.cue('drop');
        board = landed;
        show();
      }
      await sleep(140);

      for (const step of resolution.steps) {
        if (!alive()) return;

        if (step.type === 'merge') {
          const pointsPerTile = step.count > 0 ? step.points / step.count : 0;
          const flights: Promise<void>[] = [];
          for (let index = 0; index < step.count; index += 1) {
            const from = topFaceCenter(metrics, step.from, height(board, step.from));
            const taken = popTile(board, step.from);
            board = taken.board;
            const landing = topFaceCenter(metrics, step.to, height(board, step.to) + index + 1);
            show();
            const color = taken.color ?? step.color;
            flights.push(
              effects.hop({ from, to: landing, color, hw: metrics.hw, delay: 0 }).then(() => {
                if (!alive()) return;
                board = pushTile(board, step.to, color);
                pending = Math.max(0, pending - pointsPerTile);
                feedback.cue('hop', hops);
                hops += 1;
                show();
              }),
            );
            await sleep(HOP_STAGGER);
          }
          await Promise.all(flights);
          board = step.board;
          show();
          continue;
        }

        // Clear: the run bursts tile by tile, points fly to the bar.
        feedback.cue('clear', step.chain);
        const target = barTarget(by);
        const at = topFaceCenter(metrics, step.at, height(board, step.at));
        effects.floatText({ at: { x: at.x, y: at.y - metrics.hw * 0.6 }, text: `+${formatNumber(step.points)}`, tone: 'points' });
        if (step.chain > 1) {
          effects.floatText({ at: { x: at.x, y: at.y - metrics.hw * 1.35 }, text: `Combo ×${step.chain}`, tone: 'chain', delay: 120 });
        }
        const bursts: Promise<void>[] = [];
        for (let index = 0; index < step.count; index += 1) {
          const top = topFaceCenter(metrics, step.at, height(board, step.at));
          const taken = popTile(board, step.at);
          board = taken.board;
          show();
          bursts.push(effects.pop({ at: top, to: index % 2 === 0 ? target : null, color: taken.color ?? step.color, hw: metrics.hw, delay: 0 }));
          await sleep(POP_STAGGER);
        }
        await Promise.all(bursts);
        pending = Math.max(0, pending - step.points);
        board = step.board;
        show();
      }

      if (alive()) setPlayback(IDLE);
    },
    [effectsRef, measure, barTarget, feedback, reducedMotion],
  );

  const reset = useCallback(() => {
    runRef.current += 1;
    effectsRef.current?.clear();
    setPlayback(IDLE);
  }, [effectsRef]);

  return { playback, play, reset };
};
