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

export function BackIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={2.8} {...props}>
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </svg>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={1.9} {...props}>
      <path d="M19.36 9.75 L21.98 9.88 L21.98 14.12 L19.36 14.25 L18.80 15.61 L20.55 17.56 L17.56 20.55 L15.61 18.80 L14.25 19.36 L14.12 21.98 L9.88 21.98 L9.75 19.36 L8.39 18.80 L6.44 20.55 L3.45 17.56 L5.20 15.61 L4.64 14.25 L2.02 14.12 L2.02 9.88 L4.64 9.75 L5.20 8.39 L3.45 6.44 L6.44 3.45 L8.39 5.20 L9.75 4.64 L9.88 2.02 L14.12 2.02 L14.25 4.64 L15.61 5.20 L17.56 3.45 L20.55 6.44 L18.80 8.39Z" />
      <circle cx="12" cy="12" r="3.4" />
    </svg>
  );
}

export function HelpIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={2.2} {...props}>
      <circle cx="12" cy="12" r="9.2" />
      <path d="M9.4 9.4a2.7 2.7 0 0 1 5.2 1c0 1.8-2.6 2.3-2.6 4" />
      <circle cx="12" cy="17.4" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={2.2} {...props}>
      <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
    </svg>
  );
}

export function ExternalIcon(props: IconProps) {
  return (
    <svg {...base} strokeWidth={2.2} {...props}>
      <path d="M13.5 5H19v5.5M19 5l-8 8M10 6H6.5A1.5 1.5 0 0 0 5 7.5v10A1.5 1.5 0 0 0 6.5 19h10a1.5 1.5 0 0 0 1.5-1.5V14" />
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
