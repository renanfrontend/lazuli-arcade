import type { ReactElement } from 'react';
import type { TileColor } from '../../domain';

/** One silhouette per color, so tiles stay distinguishable without color vision. */
const SHAPES: Readonly<Record<TileColor, ReactElement>> = {
  sky: (
    <path
      d="M12 3.4v17.2M4.55 7.7l14.9 8.6M4.55 16.3l14.9-8.6"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.4"
      strokeLinecap="round"
    />
  ),
  grape: (
    <path
      d="M12 3.4 19.4 7.7v8.6L12 20.6 4.6 16.3V7.7Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.3"
      strokeLinejoin="round"
    />
  ),
  sun: <path d="M12 2.6c.95 5.25 3.55 7.85 9.4 9.4-5.85 1.55-8.45 4.15-9.4 9.4-.95-5.25-3.55-7.85-9.4-9.4 5.85-1.55 8.45-4.15 9.4-9.4Z" fill="currentColor" />,
  rose: <circle cx="12" cy="12" r="6.4" fill="none" stroke="currentColor" strokeWidth="3.8" />,
  leaf: (
    <g fill="currentColor">
      <circle cx="8.4" cy="8.4" r="4" />
      <circle cx="15.6" cy="8.4" r="4" />
      <circle cx="8.4" cy="15.6" r="4" />
      <circle cx="15.6" cy="15.6" r="4" />
    </g>
  ),
  royal: <path d="M12 4.6 19.6 18H4.4Z" fill="currentColor" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" />,
};

export function TileIcon({ color, className }: { readonly color: TileColor; readonly className?: string | undefined }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      {SHAPES[color]}
    </svg>
  );
}
