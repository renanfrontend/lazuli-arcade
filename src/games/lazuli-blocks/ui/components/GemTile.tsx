import { memo } from 'react';
import type { GemKind } from '../../domain';
import { cx } from '@shared/ui/cx';
import gemStyles from '../styles/gems.module.css';

export type GemVariant = 'solid' | 'ghost' | 'invalid';

interface GemTileProps {
  readonly gem: GemKind;
  readonly variant?: GemVariant;
  readonly glow?: boolean;
  readonly animateIn?: boolean;
}

export const GemTile = memo(function GemTile({ gem, variant = 'solid', glow = false, animateIn = false }: GemTileProps) {
  return (
    <span
      className={cx(
        gemStyles.gem,
        variant === 'ghost' && gemStyles.ghost,
        variant === 'invalid' && gemStyles.invalid,
        glow && gemStyles.glow,
        animateIn && gemStyles.enter,
      )}
      data-gem={gem}
      aria-hidden="true"
    />
  );
});
