import { useImperativeHandle, useRef, type Ref } from 'react';
import { createPortal } from 'react-dom';
import type { TileColor } from '../../domain';
import { LAYER, SQUASH, type Point } from '../geometry';
import tiles from '../styles/tiles.module.css';
import styles from './EffectsLayer.module.css';

export interface HopInput {
  readonly from: Point;
  readonly to: Point;
  readonly color: TileColor;
  readonly hw: number;
  readonly delay: number;
}

export interface PopInput {
  readonly at: Point;
  /** Where the tile's points fly to (the score bar), or null to just burst. */
  readonly to: Point | null;
  readonly color: TileColor;
  readonly hw: number;
  readonly delay: number;
}

export interface FloatTextInput {
  readonly at: Point;
  readonly text: string;
  readonly tone: 'points' | 'chain' | 'rival' | 'unlock';
  readonly delay?: number;
}

export interface EmpilhaEffects {
  /** One tile flips from a stack top onto another; resolves when it lands. */
  readonly hop: (input: HopInput) => Promise<void>;
  /** A tile bursts off a clearing stack and its points fly to the bar; resolves on arrival. */
  readonly pop: (input: PopInput) => Promise<void>;
  readonly floatText: (input: FloatTextInput) => void;
  readonly ring: (at: Point, hw: number) => void;
  readonly clear: () => void;
}

const translate = (x: number, y: number) => `translate3d(${x}px, ${y}px, 0)`;

/** Quadratic Bézier point. */
const bezier = (p0: number, p1: number, p2: number, t: number) => (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t ** 2 * p2;

const settle = (animation: Animation, element: Element): Promise<void> =>
  animation.finished.then(
    () => {
      element.remove();
    },
    () => {
      element.remove();
    },
  );

const tileElement = (root: HTMLElement, color: TileColor, hw: number): HTMLSpanElement => {
  const wrapper = document.createElement('span');
  wrapper.className = `${styles.fx} ${styles.flyer}`;
  wrapper.style.setProperty('--hw', `${hw}px`);
  wrapper.style.setProperty('--squash', String(SQUASH));
  wrapper.style.setProperty('--layer', String(LAYER));
  const tile = document.createElement('span');
  tile.className = tiles.tile ?? '';
  tile.dataset.color = color;
  wrapper.append(tile);
  root.append(wrapper);
  return wrapper;
};

const createEffects = (getRoot: () => HTMLElement | null): EmpilhaEffects => ({
  hop({ from, to, color, hw, delay }) {
    const root = getRoot();
    if (!root) return Promise.resolve();
    const hh = hw * SQUASH;
    const element = tileElement(root, color, hw);
    const rise = Math.max(hw * 1.2, Math.hypot(to.x - from.x, to.y - from.y) * 0.45);
    const control = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - rise };
    const frames: Keyframe[] = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
      transform: `${translate(bezier(from.x, control.x, to.x, t) - hw, bezier(from.y, control.y, to.y, t) - hh)} scaleY(${
        // A quick flip: the tile turns over at the top of its arc.
        t === 0.5 ? -0.55 : t === 0.25 || t === 0.75 ? 0.35 : 1
      })`,
    }));
    return settle(element.animate(frames, { duration: 290, delay, easing: 'cubic-bezier(0.35, 0, 0.45, 1)', fill: 'both' }), element);
  },

  pop({ at, to, color, hw, delay }) {
    const root = getRoot();
    if (!root) return Promise.resolve();
    const hh = hw * SQUASH;
    const element = tileElement(root, color, hw);
    const at0 = translate(at.x - hw, at.y - hh);
    const burst = settle(
      element.animate(
        [
          { transform: `${at0} scale(1)`, filter: 'brightness(1)', opacity: 1 },
          { transform: `${at0} scale(1.22)`, filter: 'brightness(1.8)', opacity: 1, offset: 0.45 },
          { transform: `${at0} scale(0.4)`, filter: 'brightness(2.2)', opacity: 0 },
        ],
        { duration: 300, delay, easing: 'ease-out', fill: 'both' },
      ),
      element,
    );
    if (!to) return burst;

    const spark = document.createElement('span');
    spark.className = `${styles.fx} ${styles.spark}`;
    spark.dataset.color = color;
    root.append(spark);
    const size = Math.max(10, hw * 0.34);
    spark.style.width = `${size}px`;
    spark.style.height = `${size}px`;
    const start = { x: at.x - size / 2, y: at.y - size / 2 };
    const end = { x: to.x - size / 2, y: to.y - size / 2 };
    const control = { x: start.x + (Math.random() - 0.5) * hw * 3, y: Math.min(start.y, end.y) - hw * 1.5 };
    const frames: Keyframe[] = [0, 0.2, 0.45, 0.7, 1].map((t) => ({
      transform: `${translate(bezier(start.x, control.x, end.x, t), bezier(start.y, control.y, end.y, t))} scale(${1 - 0.45 * t})`,
      opacity: t === 0 ? 0 : 1,
    }));
    return Promise.all([
      burst,
      settle(spark.animate(frames, { duration: 520, delay: delay + 120, easing: 'cubic-bezier(0.5, 0, 0.75, 1)', fill: 'both' }), spark),
    ]).then(() => undefined);
  },

  floatText({ at, text, tone, delay = 0 }) {
    const root = getRoot();
    if (!root) return;
    const label = document.createElement('span');
    label.className = `${styles.fx} ${styles.text} ${styles[tone] ?? ''}`;
    label.textContent = text;
    root.append(label);
    const place = (dy: number, scale: number) => `${translate(at.x, at.y + dy)} translate(-50%, -50%) scale(${scale})`;
    void settle(
      label.animate(
        [
          { transform: place(10, 0.6), opacity: 0 },
          { transform: place(0, 1.08), opacity: 1, offset: 0.18 },
          { transform: place(-22, 1), opacity: 1, offset: 0.75 },
          { transform: place(-36, 0.95), opacity: 0 },
        ],
        { duration: 1100, delay, easing: 'ease-out', fill: 'both' },
      ),
      label,
    );
  },

  ring(at, hw) {
    const root = getRoot();
    if (!root) return;
    const ring = document.createElement('span');
    ring.className = `${styles.fx} ${styles.ring}`;
    const size = hw * 2;
    ring.style.width = `${size}px`;
    ring.style.height = `${size * SQUASH}px`;
    root.append(ring);
    const place = translate(at.x - size / 2, at.y - (size * SQUASH) / 2);
    void settle(
      ring.animate(
        [
          { transform: `${place} scale(0.4)`, opacity: 1 },
          { transform: `${place} scale(1.6)`, opacity: 0 },
        ],
        { duration: 650, easing: 'ease-out', fill: 'both' },
      ),
      ring,
    );
  },

  clear() {
    const root = getRoot();
    if (!root) return;
    for (const element of [...root.children]) {
      for (const animation of element.getAnimations()) animation.cancel();
      element.remove();
    }
  },
});

interface EffectsLayerProps {
  readonly ref: Ref<EmpilhaEffects>;
}

/** Fire-and-forget animations drawn imperatively in a fixed overlay: no React work per frame. */
export function EffectsLayer({ ref }: EffectsLayerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => createEffects(() => rootRef.current), []);
  return createPortal(<div ref={rootRef} className={styles.layer} aria-hidden="true" />, document.body);
}
