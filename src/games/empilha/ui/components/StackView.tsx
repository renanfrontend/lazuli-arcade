import { memo } from 'react';
import { cx } from '@shared/ui/cx';
import { DRAG_VISUAL_ATTR } from '@shared/ui/drag/usePointerDrag';
import { topColor, topRunLength, type Stack } from '../../domain';
import { MAX_LAYERS } from '../geometry';
import styles from '../styles/tiles.module.css';
import { TileIcon } from './TileIcon';

interface StackViewProps {
  readonly tiles: Stack;
  readonly faded?: boolean;
  readonly className?: string | undefined;
}

/** A stack drawn tile by tile, bottom first; the top face shows its symbol and run length. */
export const StackView = memo(function StackView({ tiles, faded = false, className }: StackViewProps) {
  const visible = tiles.slice(-MAX_LAYERS);
  const top = topColor(tiles);
  const run = topRunLength(tiles);

  return (
    <span
      className={cx(styles.stack, faded && styles.faded, className)}
      style={{ '--n': Math.max(1, visible.length) }}
      {...{ [DRAG_VISUAL_ATTR]: '' }}
    >
      {visible.map((color, layer) => {
        const isTop = layer === visible.length - 1;
        return (
          <span key={layer} className={styles.layer} style={{ '--k': layer }}>
            <span className={styles.tile} data-color={color}>
              {isTop && top && (
                <>
                  <TileIcon color={top} className={styles.icon} />
                  <span className={styles.count}>{run}</span>
                </>
              )}
            </span>
          </span>
        );
      })}
    </span>
  );
});
