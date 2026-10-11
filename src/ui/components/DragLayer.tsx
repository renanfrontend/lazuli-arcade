import { createPortal } from 'react-dom';
import type { DragView } from '../hooks/usePieceDrag';
import styles from './DragLayer.module.css';
import { PieceGems } from './PieceGems';

interface DragLayerProps {
  readonly view: DragView | null;
  readonly layerRef: (element: HTMLDivElement | null) => void;
}

/** The piece under the finger, rendered at board scale above everything else. */
export function DragLayer({ view, layerRef }: DragLayerProps) {
  if (!view) return null;
  return createPortal(
    <div className={styles.layer} aria-hidden="true">
      <div
        ref={layerRef}
        className={styles.piece}
        data-snapped={view.origin !== null}
        style={{ '--cell': `${view.cell}px` }}
      >
        <PieceGems shape={view.piece.shape} gem={view.piece.gem} />
      </div>
    </div>,
    document.body,
  );
}
