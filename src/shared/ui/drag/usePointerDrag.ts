import { useCallback, useRef, useState, type MouseEvent, type PointerEvent } from 'react';

export interface FloatingRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface DragView<TItem, TTarget> {
  readonly item: TItem;
  /** Where the item would land right now, or null. */
  readonly target: TTarget | null;
  readonly width: number;
  readonly height: number;
  /** True while a rejected item flies back to where it came from. */
  readonly returning: boolean;
}

export interface PointerDragOptions<TItem, TTarget> {
  readonly enabled: boolean;
  readonly reducedMotion: boolean;
  /** Size of the floating copy at full (board) scale, measured when the drag starts. */
  readonly measure: (item: TItem) => { readonly width: number; readonly height: number } | null;
  /** Drop target under the floating copy, or null. */
  readonly snap: (item: TItem, rect: FloatingRect) => TTarget | null;
  readonly sameTarget: (a: TTarget, b: TTarget) => boolean;
  readonly sameItem: (a: TItem, b: TItem) => boolean;
  readonly onDrop: (item: TItem, target: TTarget) => void;
  /** A press released without moving: select-then-place mode. */
  readonly onTap: (item: TItem, source: 'pointer' | 'keyboard') => void;
  readonly onPick?: (item: TItem) => void;
  readonly onCancel?: (item: TItem) => void;
  /** Touch only: how far above the finger the copy floats, in multiples of its height. */
  readonly touchLift?: number;
}

export interface DragHandlers {
  readonly onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  readonly onLostPointerCapture: (event: PointerEvent<HTMLElement>) => void;
  readonly onClick: (event: MouseEvent<HTMLElement>) => void;
}

interface Session<TItem, TTarget> {
  readonly item: TItem;
  readonly pointerId: number;
  readonly pointerType: string;
  readonly startX: number;
  readonly startY: number;
  readonly source: HTMLElement;
  /** Width of the item as drawn in its source, for the grow-on-pick animation. */
  readonly sourceWidth: number;
  /** How far above the pointer the copy floats, in multiples of its height (0 for mice). */
  readonly lift: number;
  x: number;
  y: number;
  dragging: boolean;
  width: number;
  height: number;
  target: TTarget | null;
  frame: number;
}

const THRESHOLD = { mouse: 4, other: 7 } as const;

/** Marks the element inside a draggable whose size is the item's rest size. */
export const DRAG_VISUAL_ATTR = 'data-drag-visual';

const rectOf = (session: { x: number; y: number; width: number; height: number; lift: number }): FloatingRect => ({
  left: session.x - session.width / 2,
  top: session.y - session.height / 2 - session.height * session.lift,
  width: session.width,
  height: session.height,
});

/**
 * Pointer-event drag and drop (mouse, touch and pen alike) for anything that lands on a target.
 * Per-frame work stays out of React: the floating copy moves through its style, and React
 * re-renders only when the snapped target changes.
 */
export function usePointerDrag<TItem, TTarget>(options: PointerDragOptions<TItem, TTarget>) {
  const [view, setView] = useState<DragView<TItem, TTarget> | null>(null);
  const sessionRef = useRef<Session<TItem, TTarget> | null>(null);
  const layerRef = useRef<HTMLElement | null>(null);
  const suppressClickUntil = useRef(0);
  const { reducedMotion } = options;
  const touchLift = options.touchLift ?? 0.75;

  const paint = (session: Session<TItem, TTarget>) => {
    const element = layerRef.current;
    if (!element) return;
    const { left, top } = rectOf(session);
    element.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  };

  const attachLayer = useCallback(
    (element: HTMLDivElement | null) => {
      layerRef.current = element;
      const session = sessionRef.current;
      if (!element || !session) return;
      const { left, top } = rectOf(session);
      element.style.transform = `translate3d(${left}px, ${top}px, 0)`;
      if (!reducedMotion && session.sourceWidth > 0 && session.width > 0) {
        element.firstElementChild?.animate([{ scale: String(session.sourceWidth / session.width) }, { scale: '1' }], {
          duration: 150,
          easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.25)',
        });
      }
    },
    [reducedMotion],
  );

  const sameTarget = (a: TTarget | null, b: TTarget | null) =>
    a === null || b === null ? a === b : options.sameTarget(a, b);

  const startDragging = (session: Session<TItem, TTarget>): boolean => {
    const size = options.measure(session.item);
    if (!size || size.width <= 0) return false;
    session.width = size.width;
    session.height = size.height;
    session.dragging = true;
    setView({ item: session.item, target: null, width: size.width, height: size.height, returning: false });
    options.onPick?.(session.item);
    return true;
  };

  const flyBack = (session: Session<TItem, TTarget>) => {
    const element = layerRef.current;
    if (!element || reducedMotion) {
      setView(null);
      return;
    }
    setView((current) => current && { ...current, target: null, returning: true });
    const from = rectOf(session);
    const to = session.source.getBoundingClientRect();
    const scale = session.sourceWidth > 0 ? session.sourceWidth / session.width : 0.6;
    const toLeft = to.left + to.width / 2 - from.width / 2;
    const toTop = to.top + to.height / 2 - from.height / 2;
    const animation = element.animate(
      [
        { transform: `translate3d(${from.left}px, ${from.top}px, 0) scale(1)` },
        { transform: `translate3d(${toLeft}px, ${toTop}px, 0) scale(${scale})` },
      ],
      { duration: 220, easing: 'cubic-bezier(0.3, 0.7, 0.4, 1)', fill: 'forwards' },
    );
    const done = () => {
      setView((current) => (current && options.sameItem(current.item, session.item) ? null : current));
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
    if (session.source.hasPointerCapture(session.pointerId)) session.source.releasePointerCapture(session.pointerId);

    if (!session.dragging) {
      if (!cancelled) options.onTap(session.item, 'pointer');
      return;
    }
    if (!cancelled) {
      session.x = event.clientX;
      session.y = event.clientY;
    }
    const target = cancelled ? null : options.snap(session.item, rectOf(session));
    if (target !== null) {
      setView(null);
      options.onDrop(session.item, target);
      return;
    }
    options.onCancel?.(session.item);
    flyBack(session);
  };

  const bind = (item: TItem): DragHandlers => ({
    onPointerDown: (event) => {
      if (!options.enabled || sessionRef.current || view) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      event.preventDefault();
      const source = event.currentTarget;
      try {
        source.setPointerCapture(event.pointerId);
      } catch {
        // Capture is an optimisation; touch pointers are implicitly captured anyway.
      }
      const visual = source.querySelector(`[${DRAG_VISUAL_ATTR}]`) ?? source;
      sessionRef.current = {
        item,
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        startX: event.clientX,
        startY: event.clientY,
        source,
        sourceWidth: visual.getBoundingClientRect().width,
        lift: event.pointerType === 'mouse' ? 0 : touchLift,
        x: event.clientX,
        y: event.clientY,
        dragging: false,
        width: 0,
        height: 0,
        target: null,
        frame: 0,
      };
    },
    onPointerMove: (event) => {
      const session = sessionRef.current;
      if (event.pointerId !== session?.pointerId) return;
      session.x = event.clientX;
      session.y = event.clientY;
      if (!session.dragging) {
        const threshold = session.pointerType === 'mouse' ? THRESHOLD.mouse : THRESHOLD.other;
        if (Math.hypot(session.x - session.startX, session.y - session.startY) < threshold) return;
        if (!startDragging(session)) return;
      }
      if (session.frame) return;
      session.frame = requestAnimationFrame(() => {
        session.frame = 0;
        if (sessionRef.current !== session) return;
        paint(session);
        const target = options.snap(session.item, rectOf(session));
        if (!sameTarget(target, session.target)) {
          session.target = target;
          setView((current) => (current && options.sameItem(current.item, session.item) ? { ...current, target } : current));
        }
      });
    },
    onPointerUp: (event) => {
      end(event, false);
    },
    onPointerCancel: (event) => {
      end(event, true);
    },
    onLostPointerCapture: (event) => {
      end(event, true);
    },
    /** Keyboard and assistive-tech activation (pointer taps are handled above). */
    onClick: (event) => {
      event.preventDefault();
      if (!options.enabled || performance.now() < suppressClickUntil.current) return;
      options.onTap(item, 'keyboard');
    },
  });

  return { view, bind, attachLayer };
}
