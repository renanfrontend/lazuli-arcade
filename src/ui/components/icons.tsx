import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

export function SoundOnIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
      <path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11" />
    </svg>
  );
}

export function SoundOffIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
      <path d="M16 9.5l5 5M21 9.5l-5 5" />
    </svg>
  );
}

export function RestartIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5" />
      <path d="M4 4.5v4.2h4.2" />
    </svg>
  );
}

export function ShuffleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 7h3.2c4.8 0 5.8 10 10.6 10h3.2" />
      <path d="M3.5 17h3.2c1.6 0 2.7-1.1 3.6-2.6M13.6 9.6C14.5 8.1 15.6 7 17.3 7h3.2" />
      <path d="M18 4.5L20.5 7 18 9.5M18 14.5l2.5 2.5-2.5 2.5" />
    </svg>
  );
}

/** Gold coin with an embossed gem. */
export function CoinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden focusable={false} {...props}>
      <circle cx="24" cy="24" r="21" fill="var(--gold-deep)" stroke="var(--ink)" strokeWidth="3" />
      <circle cx="24" cy="22.6" r="18" fill="var(--gold)" />
      <circle cx="24" cy="22.6" r="12.6" fill="none" stroke="var(--gold-deep)" strokeWidth="2.4" />
      <path d="M24 13.5 31.2 22.6 24 31.7 16.8 22.6Z" fill="var(--gold-light)" stroke="var(--gold-deep)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M11.5 15.5C14 10.4 18.4 8 23.4 7.8" fill="none" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
