import { useImperativeHandle, useRef, type Ref } from 'react';
import { createPortal } from 'react-dom';
import type { GemKind } from '../../domain';
import gemStyles from '../styles/gems.module.css';
import styles from './EffectsLayer.module.css';

export interface BurstCell {
  /** Viewport coordinates of the cell's top-left corner. */
  readonly x: number;
  readonly y: number;
  readonly gem: GemKind;
}

export interface BurstInput {
  readonly cells: readonly BurstCell[];
  readonly cell: number;
  readonly target: { readonly x: number; readonly y: number } | null;
  readonly onCoinArrive: () => void;
}

export interface FloatTextInput {
  readonly x: number;
  readonly y: number;
  readonly text: string;
  readonly tone: 'points' | 'praise' | 'combo';
  readonly delay?: number;
}

export interface EffectsHandle {
  readonly burst: (input: BurstInput) => void;
  readonly floatText: (input: FloatTextInput) => void;
  readonly shake: (element: HTMLElement | null, strength: number) => void;
}

const spawn = (root: HTMLElement, className: string): HTMLSpanElement => {
  const element = document.createElement('span');
  element.className = className;
  root.append(element);
  return element;
};

const removeWhenDone = (animation: Animation, element: Element, onDone?: () => void) => {
  const finish = () => {
    element.remove();
    onDone?.();
  };
  animation.addEventListener('finish', finish, { once: true });
  animation.addEventListener('cancel', finish, { once: true });
};

const translate = (x: number, y: number) => `translate3d(${x}px, ${y}px, 0)`;

/** Quadratic Bézier point. */
const bezier = (p0: number, p1: number, p2: number, t: number) => (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t ** 2 * p2;

const createEffects = (getRoot: () => HTMLElement | null, reducedMotion: boolean): EffectsHandle => ({
  burst({ cells, cell, target, onCoinArrive }) {
    const root = getRoot();
    if (!root) return;
    const stagger = Math.min(24, 520 / Math.max(1, cells.length));

    cells.forEach((item, index) => {
      // 1. The gem flashes and shrinks away where it stood.
      const shell = spawn(root, `${styles.fx} ${styles.gemShell}`);
      shell.style.setProperty('--cell', `${cell}px`);
      shell.style.width = `${cell}px`;
      shell.style.height = `${cell}px`;
      const tile = document.createElement('span');
      tile.className = gemStyles.gem ?? '';
      tile.dataset.gem = item.gem;
      shell.append(tile);
      const at = translate(item.x, item.y);
      removeWhenDone(
        shell.animate(
          reducedMotion
            ? [
                { transform: at, opacity: 1 },
                { transform: at, opacity: 0 },
              ]
            : [
                { transform: `${at} scale(1)`, filter: 'brightness(1)', opacity: 1 },
                { transform: `${at} scale(1.2)`, filter: 'brightness(2.3)', opacity: 1, offset: 0.4 },
                { transform: `${at} scale(0.25)`, filter: 'brightness(2.6)', opacity: 0 },
              ],
          {
            duration: reducedMotion ? 200 : 360,
            delay: reducedMotion ? 0 : index * stagger * 0.4,
            easing: 'ease-out',
            fill: 'both',
          },
        ),
        shell,
      );
      if (reducedMotion) return;

      const cx = item.x + cell / 2;
      const cy = item.y + cell / 2;

      // 2. A couple of shards spray outwards.
      for (let shardIndex = 0; shardIndex < 2; shardIndex += 1) {
        const shard = spawn(root, `${styles.fx} ${styles.shard}`);
        shard.dataset.gem = item.gem;
        const size = cell * (0.16 + Math.random() * 0.12);
        shard.style.width = `${size}px`;
        shard.style.height = `${size}px`;
        const angle = Math.random() * Math.PI * 2;
        const distance = cell * (0.9 + Math.random() * 1.1);
        const x0 = cx - size / 2;
        const y0 = cy - size / 2;
        removeWhenDone(
          shard.animate(
            [
              { transform: `${translate(x0, y0)} rotate(0deg) scale(1)`, opacity: 1 },
              {
                transform: `${translate(x0 + Math.cos(angle) * distance, y0 + Math.sin(angle) * distance + cell * 0.5)} rotate(${(Math.random() * 2 - 1) * 280}deg) scale(0.4)`,
                opacity: 0,
              },
            ],
            {
              duration: 520 + Math.random() * 220,
              delay: index * stagger * 0.4,
              easing: 'cubic-bezier(0.15, 0.7, 0.35, 1)',
              fill: 'both',
            },
          ),
          shard,
        );
      }

      // 3. Every gem becomes a coin that arcs into the coin counter.
      if (!target) return;
      const coin = spawn(root, `${styles.fx} ${styles.coin}`);
      const size = Math.max(14, cell * 0.74);
      coin.style.setProperty('--s', `${size}px`);
      coin.style.width = `${size}px`;
      coin.style.height = `${size}px`;
      const start = { x: cx - size / 2, y: cy - size / 2 - cell * 0.35 };
      const end = { x: target.x - size / 2, y: target.y - size / 2 };
      const control = {
        x: start.x + (Math.random() - 0.5) * cell * 5,
        y: start.y - (start.y - end.y) * (0.15 + Math.random() * 0.2),
      };
      const pathFrames: Keyframe[] = [0.2, 0.4, 0.6, 0.8, 1].map((t) => ({
        transform: `${translate(bezier(start.x, control.x, end.x, t), bezier(start.y, control.y, end.y, t))} scale(${1 - 0.4 * t})`,
        offset: 0.36 + 0.64 * Math.sqrt(t),
      }));
      removeWhenDone(
        coin.animate(
          [
            { transform: `${translate(start.x, start.y + cell * 0.35)} scale(0.2)`, opacity: 0 },
            { transform: `${translate(start.x, start.y + cell * 0.1)} scale(1.15)`, opacity: 1, offset: 0.2 },
            { transform: `${translate(start.x, start.y)} scale(1)`, opacity: 1, offset: 0.36 },
            ...pathFrames,
          ],
          { duration: 1000, delay: 80 + index * stagger, fill: 'both' },
        ),
        coin,
        onCoinArrive,
      );
    });
  },

  floatText({ x, y, text, tone, delay = 0 }) {
    const root = getRoot();
    if (!root) return;
    const label = document.createElement('span');
    label.className = `${styles.fx} ${styles.text} ${styles[tone] ?? ''}`;
    label.textContent = text;
    root.append(label);
    const at = (dy: number, scale: number) => `${translate(x, y + dy)} translate(-50%, -50%) scale(${scale})`;
    const frames: Keyframe[] = reducedMotion
      ? [
          { transform: at(0, 1), opacity: 0 },
          { transform: at(0, 1), opacity: 1, offset: 0.15 },
          { transform: at(0, 1), opacity: 1, offset: 0.8 },
          { transform: at(0, 1), opacity: 0 },
        ]
      : tone === 'praise'
        ? [
            { transform: at(0, 0.4), opacity: 0 },
            { transform: at(0, 1.15), opacity: 1, offset: 0.16, easing: 'ease-out' },
            { transform: at(0, 1), opacity: 1, offset: 0.28 },
            { transform: at(-18, 1), opacity: 1, offset: 0.8 },
            { transform: at(-30, 0.92), opacity: 0 },
          ]
        : [
            { transform: at(8, 0.7), opacity: 0 },
            { transform: at(0, 1.05), opacity: 1, offset: 0.18 },
            { transform: at(-26, 1), opacity: 1, offset: 0.75 },
            { transform: at(-40, 0.95), opacity: 0 },
          ];
    removeWhenDone(
      label.animate(frames, {
        duration: tone === 'praise' ? 1300 : 1050,
        delay,
        easing: 'ease-out',
        fill: 'both',
      }),
      label,
    );
  },

  shake(element, strength) {
    if (!element || reducedMotion) return;
    const s = strength;
    element.animate(
      [
        { transform: 'translate(0, 0)' },
        { transform: `translate(${-s}px, ${s * 0.4}px)` },
        { transform: `translate(${s * 0.9}px, ${-s * 0.5}px)` },
        { transform: `translate(${-s * 0.6}px, ${s * 0.3}px)` },
        { transform: `translate(${s * 0.3}px, 0)` },
        { transform: 'translate(0, 0)' },
      ],
      { duration: 380, easing: 'ease-out' },
    );
  },
});

interface EffectsLayerProps {
  readonly ref: Ref<EffectsHandle>;
  readonly reducedMotion: boolean;
}

/** Fire-and-forget particles drawn imperatively in a fixed overlay. */
export function EffectsLayer({ ref, reducedMotion }: EffectsLayerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => createEffects(() => rootRef.current, reducedMotion), [reducedMotion]);
  return createPortal(<div ref={rootRef} className={styles.layer} aria-hidden="true" />, document.body);
}
