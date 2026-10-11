import type { CSSProperties } from 'react';
import type { GemKind, Shape } from '../../domain';
import { GemTile, type GemVariant } from './GemTile';
import styles from './PieceGems.module.css';

interface PieceGemsProps {
  readonly shape: Shape;
  readonly gem: GemKind;
  readonly variant?: GemVariant | undefined;
}

/** A polyomino drawn as gems; block size comes from the inherited --cell. */
export function PieceGems({ shape, gem, variant = 'solid' }: PieceGemsProps) {
  return (
    <span
      className={styles.piece}
      style={{ '--w': shape.width, '--h': shape.height } as CSSProperties}
      data-piece=""
    >
      {shape.cells.map(({ col, row }) => (
        <span
          key={`${col}:${row}`}
          className={styles.block}
          style={{ gridColumn: col + 1, gridRow: row + 1 }}
        >
          <GemTile gem={gem} variant={variant} />
        </span>
      ))}
    </span>
  );
}
