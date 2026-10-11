import { useCallback, useRef, useState, type MouseEvent, type PointerEvent, type RefObject } from 'react';
import { nearestValidOrigin, samePosition, type Board, type Position, type TrayPiece } from '../../domain';
import type { SelectSource } from './usePlacementCursor';

export interface DragView {
  readonly piece: TrayPiece;
  /** Snapped origin where the piece would land, null when it would not fit. */
  readonly origin: Position | null;
  /** Board cell size in px, measured when the drag started. */
  readonly cell: number;
  /** True while a rejected piece flies back to the tray. */
  readonly returning: boolean;
}

interface Session {
  readonly piece: TrayPiece;
  readonly pointerId: number;
  readonly pointerType: string;
  readonly startX: number;
  readonly startY: number;
  readonly source: HTMLElement;
  readonly miniCell: number;
  x: number;
  y: number;
  dragging: boolean;
  origin: Position | null;
  cell: number;
  grid: DOMRect | null;
  frame: number;
}

interface DragOptions {
  readonly board: Board;
  readonly enabled: boolean;
  readonly reducedMotion: boolean;
  readonly gridRef: RefObject<HTMLElement | null>;
  readonly onPick: (piece: TrayPiece) => void;
  readonly onDrop: (piece: TrayPiece, origin: Position) => void;
  readonly onCancel: (piece: TrayPiece) => void;
  readonly onSelect: (piece: TrayPiece, source: SelectSource) => void;
}

/** Fingers cover what they hold: on touch the piece floats above the contact point. */
const TOUCH_LIFT_CELLS = 1.2;
const DRAG_THRESHOLD = { mouse: 4, other: 7 } as const;

const pieceRect = (session: Session) => {
  const width = session.piece.shape.width * session.cell;
  const height = session.piece.shape.height * session.cell;
  const lift = session.pointerType === 'mouse' ? 0 : height / 2 + session.cell * TOUCH_LIFT_CELLS;
  return { left: session.x - width / 2, top: session.y - height / 2 - lift, width, height };
};

const paint = (element: HTMLElement | null, session: Session) => {
  if (!element) return;
  const { left, top } = pieceRect(session);
  element.style.transform = `translate3d(${left}px, ${top}px, 0)`;
};

const sameOrigin = (a: Position | null, b: Position | null) =>
  a === null || b === null ? a === b : samePosition(a, b);

/**
 * Pointer-event drag and drop for tray pieces (mouse, touch and pen alike).
 * Per-frame work stays out of React: the floating piece is moved through its
 * style, and React re-renders only when the snapped landing cell changes.
 */
export const usePieceDrag = (options: DragOptions) => {
  const [view, setView] = useState<DragView | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const layerRef = useRef<HTMLElement | null>(null);
  const suppressClickUntil = useRef(0);
  const { reducedMotion } = options;

  const attachLayer = useCallback(
    (element: HTMLDivElement | null) => {
      layerRef.current = element;
      const session = sessionRef.current;
      if (!element || !session) return;
      paint(element, session);
      if (!reducedMotion && session.cell > 0 && session.miniCell > 0) {
        element.animate([{ scale: String(session.miniCell / session.cell) }, { scale: '1' }], {
          duration: 150,
          easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.25)',
        });
      }
    },
    [reducedMotion],
  );

  const snap = (session: Session): Position | null => {
    if (!session.grid || session.cell <= 0) return null;
    const { left, top } = pieceRect(session);
    return nearestValidOrigin(options.board, session.piece.shape, {
      col: (left - session.grid.left) / session.cell,
      row: (top - session.grid.top) / session.cell,
    });
  };

  const startDragging = (session: Session): boolean => {
    const grid = options.gridRef.current?.getBoundingClientRect();
    if (!grid || grid.width === 0) return false;
    session.grid = grid;
    session.cell = grid.width / options.board.cols;
    session.dragging = true;
    setView({ piece: session.piece, origin: null, cell: session.cell, returning: false });
    options.onPick(session.piece);
    return true;
  };

  const flyBack = (session: Session) => {
    const element = layerRef.current;
    if (!element || reducedMotion) {
      setView(null);
      return;
    }
    setView((current) => current && { ...current, origin: null, returning: true });
    const from = pieceRect(session);
    const target = session.source.getBoundingClientRect();
    const scale = session.miniCell > 0 ? session.miniCell / session.cell : 0.6;
    const toLeft = target.left + target.width / 2 - from.width / 2;
    const toTop = target.top + target.height / 2 - from.height / 2;
    const animation = element.animate(
      [
        { transform: `translate3d(${from.left}px, ${from.top}px, 0) scale(1)` },
        { transform: `translate3d(${toLeft}px, ${toTop}px, 0) scale(${scale})` },
      ],
      { duration: 220, easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)', fill: 'forwards' },
    );
    const done = () => {
      setView((current) => (current?.piece.id === session.piece.id ? null : current));
    };
    animation.addEventListener('finish', done);
    animation.addEventListener('cancel', done);
  };

  const end = (event: PointerEvent<HTMLElement>, cancelled: boolean) => {
    const session = sessionRef.current;
    if (event.pointerId !== session?.pointerId) return;
    sessionRef.current = null;
    suppressClickUntil.current = performance.now() + 450;
    if (session.frame) cancelAnimationFrame(session.frame);
    if (session.source.hasPointerCapture(session.pointerId)) {
      session.source.releasePointerCapture(session.pointerId);
    }

    if (!session.dragging) {
      if (!cancelled) options.onSelect(session.piece, 'pointer');
      return;
    }

    if (!cancelled) {
      session.x = event.clientX;
      session.y = event.clientY;
    }
    const origin = cancelled ? null : snap(session);
    if (origin) {
      setView(null);
      options.onDrop(session.piece, origin);
      return;
    }
    options.onCancel(session.piece);
    flyBack(session);
  };

  const bind = (piece: TrayPiece) => ({
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (!options.enabled || sessionRef.current || view) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault();
      const source = event.currentTarget;
      try {
        source.setPointerCapture(event.pointerId);
      } catch {
        // Capture is an optimisation; touch pointers are implicitly captured anyway.
      }
      const pieceElement = source.querySelector('[data-piece]');
      sessionRef.current = {
        piece,
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        startX: event.clientX,
        startY: event.clientY,
        source,
        miniCell: pieceElement ? pieceElement.getBoundingClientRect().width / piece.shape.width : 0,
        x: event.clientX,
        y: event.clientY,
        dragging: false,
        origin: null,
        cell: 0,
        grid: null,
        frame: 0,
      };
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      const session = sessionRef.current;
      if (event.pointerId !== session?.pointerId) return;
      session.x = event.clientX;
      session.y = event.clientY;
      if (!session.dragging) {
        const threshold = session.pointerType === 'mouse' ? DRAG_THRESHOLD.mouse : DRAG_THRESHOLD.other;
        if (Math.hypot(session.x - session.startX, session.y - session.startY) < threshold) return;
        if (!startDragging(session)) return;
      }
      if (session.frame) return;
      session.frame = requestAnimationFrame(() => {
        session.frame = 0;
        if (sessionRef.current !== session) return;
        paint(layerRef.current, session);
        const origin = snap(session);
        if (!sameOrigin(origin, session.origin)) {
          session.origin = origin;
          setView((current) => (current?.piece.id === session.piece.id ? { ...current, origin } : current));
        }
      });
    },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      end(event, false);
    },
    onPointerCancel: (event: PointerEvent<HTMLElement>) => {
      end(event, true);
    },
    onLostPointerCapture: (event: PointerEvent<HTMLElement>) => {
      end(event, true);
    },
    /** Keyboard and assistive-tech activation (pointer taps are handled above). */
    onClick: (event: MouseEvent<HTMLElement>) => {
      event.preventDefault();
      if (!options.enabled || performance.now() < suppressClickUntil.current) return;
      options.onSelect(piece, 'keyboard');
    },
  });

  return { view, bind, attachLayer };
};
