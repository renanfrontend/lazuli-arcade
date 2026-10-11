import { createPortal } from 'react-dom';
import type { DragView } from '@shared/ui/drag/usePointerDrag';
import type { Position } from '@shared/domain/grid';
import type { Stack } from '../../domain';
import { LAYER, SQUASH } from '../geometry';
import styles from './DragLayer.module.css';
import { StackView } from './StackView';

interface DragLayerProps {
  readonly view: DragView<number, Position> | null;
  readonly tiles: Stack | null;
  /** Board half-width in px, so the lifted stack is drawn at board scale. */
  readonly hw: number;
  readonly layerRef: (element: HTMLDivElement | null) => void;
}

/** The stack under the finger, above everything else. */
export function DragLayer({ view, tiles, hw, layerRef }: DragLayerProps) {
  if (!view || !tiles) return null;
  return createPortal(
    <div className={styles.layer} aria-hidden="true">
      <div
        ref={layerRef}
        className={styles.piece}
        data-snapped={view.target !== null}
        style={{ '--hw': `${hw}px`, '--squash': SQUASH, '--layer': LAYER }}
      >
        <StackView tiles={tiles} />
      </div>
    </div>,
    document.body,
  );
}
