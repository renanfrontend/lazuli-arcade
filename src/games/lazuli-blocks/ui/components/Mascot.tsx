import { useId } from 'react';
import styles from './Mascot.module.css';

export type MascotMood = 'chill' | 'focused' | 'happy' | 'excited' | 'worried' | 'sad';

const MOOD_LABEL: Readonly<Record<MascotMood, string>> = {
  chill: 'tranquila',
  focused: 'concentrada',
  happy: 'feliz',
  excited: 'empolgada',
  worried: 'preocupada',
  sad: 'triste',
};

interface MascotProps {
  readonly mood: MascotMood;
  readonly className?: string | undefined;
}

/** Capi: a loaf-shaped capybara balancing a sapphire on its head. Original character. */
export function Mascot({ mood, className }: MascotProps) {
  const id = useId();
  const clipId = `${id}-gem`;
  const tableId = `${id}-table`;

  return (
    <svg
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-mood={mood}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Capi, a capivara: ${MOOD_LABEL[mood]}`}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="48" y="3" width="24" height="24" rx="4" />
        </clipPath>
        <linearGradient id={tableId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7592ff" />
          <stop offset="0.55" stopColor="#4664f1" />
          <stop offset="1" stopColor="#2a3cc9" />
        </linearGradient>
      </defs>

      <ellipse className={styles.shadow} cx="60" cy="114.5" rx="36" ry="4.5" />

      <g className={styles.bob}>
        <g className={styles.ears}>
          <ellipse cx="34.5" cy="33" rx="7.5" ry="6" transform="rotate(-28 34.5 33)" />
          <ellipse cx="85.5" cy="33" rx="7.5" ry="6" transform="rotate(28 85.5 33)" />
          <ellipse className={styles.earInner} cx="34.5" cy="33.6" rx="3.6" ry="2.8" transform="rotate(-28 34.5 33.6)" />
          <ellipse className={styles.earInner} cx="85.5" cy="33.6" rx="3.6" ry="2.8" transform="rotate(28 85.5 33.6)" />
        </g>

        {/* Loaf: head and body are one rounded block, wider at the base. */}
        <path
          className={styles.loaf}
          d="M30 112 C21 112 18 106 18 97 L20 56 C21 37 36 28 60 28 C84 28 99 37 100 56 L102 97 C102 106 99 112 90 112 Z"
        />
        <path className={styles.belly} d="M38 112 C36 99 45 92 60 92 C75 92 84 99 82 112 Z" />
        <path className={styles.snout} d="M33 70 C33 59 44 55 60 55 C76 55 87 59 87 70 C87 81 76 86 60 86 C44 86 33 81 33 70 Z" />
        <g className={styles.paws}>
          <ellipse cx="45" cy="109" rx="8" ry="5" />
          <ellipse cx="75" cy="109" rx="8" ry="5" />
        </g>

        <path className={styles.nose} d="M47.5 61.5 C47.5 57.6 53 56.5 60 56.5 C67 56.5 72.5 57.6 72.5 61.5 C72.5 65.6 67.2 67.5 60 67.5 C52.8 67.5 47.5 65.6 47.5 61.5 Z" />
        <ellipse className={styles.noseGlint} cx="54.5" cy="59.4" rx="3.2" ry="1.4" />

        {(mood === 'happy' || mood === 'excited') && (
          <g className={styles.cheeks}>
            <ellipse cx="29" cy="64" rx="5.5" ry="3.3" />
            <ellipse cx="91" cy="64" rx="5.5" ry="3.3" />
          </g>
        )}

        <Face mood={mood} />

        <g className={styles.crown}>
          <g clipPath={`url(#${clipId})`}>
            <polygon points="48,3 72,3 66.5,8.5 53.5,8.5" fill="#b2c9ff" />
            <polygon points="72,3 72,27 66.5,21.5 66.5,8.5" fill="#4664f1" />
            <polygon points="72,27 48,27 53.5,21.5 66.5,21.5" fill="#18248e" />
            <polygon points="48,27 48,3 53.5,8.5 53.5,21.5" fill="#7592ff" />
            <rect x="53.5" y="8.5" width="13" height="13" rx="1.5" fill={`url(#${tableId})`} />
            <ellipse cx="55.5" cy="10.5" rx="3.2" ry="1.6" fill="#ffffff" opacity="0.9" transform="rotate(-24 55.5 10.5)" />
          </g>
          <rect x="48" y="3" width="24" height="24" rx="4" fill="none" stroke="#f2a536" strokeWidth="2.2" />
          <rect x="45.9" y="0.9" width="28.2" height="28.2" rx="6" fill="none" stroke="var(--ink)" strokeWidth="2.2" />
        </g>

        {mood === 'excited' && (
          <g className={styles.sparkles}>
            <path d="M34 6 L36 12 L42 14 L36 16 L34 22 L32 16 L26 14 L32 12 Z" />
            <path d="M88 2 L89.4 6.6 L94 8 L89.4 9.4 L88 14 L86.6 9.4 L82 8 L86.6 6.6 Z" />
          </g>
        )}
        {mood === 'worried' && <path className={styles.drop} d="M99 38 q5 7 0 10.5 q-5 -3.5 0 -10.5 Z" />}
      </g>
    </svg>
  );
}

function Face({ mood }: { readonly mood: MascotMood }) {
  switch (mood) {
    case 'chill':
      return (
        <g className={styles.face}>
          <g className={styles.eyes}>
            <path className={styles.ink} d="M36.5 46 a5 5 0 0 0 10 0 Z" />
            <path className={styles.ink} d="M73.5 46 a5 5 0 0 0 10 0 Z" />
            <circle className={styles.glint} cx="43.8" cy="48" r="1.2" />
            <circle className={styles.glint} cx="80.8" cy="48" r="1.2" />
          </g>
          <path className={styles.stroke} d="M34.5 45.5 H48.5 M71.5 45.5 H85.5" />
          <path className={styles.mouth} d="M60 67.5 V72 M53.5 72.5 Q56.8 75.8 60 72 Q63.2 75.8 66.5 72.5" />
        </g>
      );
    case 'focused':
      return (
        <g className={styles.face}>
          <g className={styles.eyes}>
            <ellipse className={styles.ink} cx="41.5" cy="47" rx="4.6" ry="5.6" />
            <ellipse className={styles.ink} cx="78.5" cy="47" rx="4.6" ry="5.6" />
            <circle className={styles.glint} cx="43.3" cy="45" r="1.6" />
            <circle className={styles.glint} cx="80.3" cy="45" r="1.6" />
          </g>
          <path className={styles.brow} d="M34.5 37.5 L47.5 40.5 M85.5 37.5 L72.5 40.5" />
          <path className={styles.mouth} d="M60 67.5 V72 M55 73 H65" />
        </g>
      );
    case 'happy':
      return (
        <g className={styles.face}>
          <path className={styles.stroke} d="M36 48 Q41.5 40.5 47 48 M73 48 Q78.5 40.5 84 48" />
          <path className={styles.ink} d="M51.5 71 Q60 84 68.5 71 Z" />
          <rect className={styles.teeth} x="56.6" y="70.6" width="6.8" height="4.4" rx="1" />
          <path className={styles.tongue} d="M55.5 77.6 Q60 81.6 64.5 77.6 Q60 76.2 55.5 77.6 Z" />
        </g>
      );
    case 'excited':
      return (
        <g className={styles.face}>
          <ellipse className={styles.ink} cx="41.5" cy="46.5" rx="5.8" ry="6.6" />
          <ellipse className={styles.ink} cx="78.5" cy="46.5" rx="5.8" ry="6.6" />
          <circle className={styles.glint} cx="43.8" cy="43.8" r="2.2" />
          <circle className={styles.glint} cx="80.8" cy="43.8" r="2.2" />
          <circle className={styles.glint} cx="39.6" cy="49" r="1" />
          <circle className={styles.glint} cx="76.6" cy="49" r="1" />
          <path className={styles.brow} d="M34.5 35.5 Q41 31.5 47.5 34.5 M85.5 35.5 Q79 31.5 72.5 34.5" />
          <path className={styles.ink} d="M50 70.5 Q60 88 70 70.5 Z" />
          <rect className={styles.teeth} x="56.4" y="70.1" width="7.2" height="4.8" rx="1" />
          <path className={styles.tongue} d="M54.5 79.4 Q60 84.6 65.5 79.4 Q60 77.6 54.5 79.4 Z" />
        </g>
      );
    case 'worried':
      return (
        <g className={styles.face}>
          <g className={styles.eyes}>
            <ellipse className={styles.ink} cx="41.5" cy="47.5" rx="4.4" ry="5.4" />
            <ellipse className={styles.ink} cx="78.5" cy="47.5" rx="4.4" ry="5.4" />
            <circle className={styles.glint} cx="43.2" cy="45.6" r="1.5" />
            <circle className={styles.glint} cx="80.2" cy="45.6" r="1.5" />
          </g>
          <path className={styles.brow} d="M34.5 40 L47 35.5 M85.5 40 L73 35.5" />
          <path className={styles.mouth} d="M60 67.5 V71.5 M53 75 q3.5 -2.8 7 0 t7 0" />
        </g>
      );
    case 'sad':
      return (
        <g className={styles.face}>
          <path className={styles.stroke} d="M36 45 Q41.5 51.5 47 45 M73 45 Q78.5 51.5 84 45" />
          <path className={styles.brow} d="M35 39.5 L47 36.5 M85 39.5 L73 36.5" />
          <path className={styles.mouth} d="M60 67.5 V71 M53.5 77 Q60 70.5 66.5 77" />
          <path className={styles.tear} d="M39 51.5 q3.4 5.4 0 7.6 q-3.4 -2.2 0 -7.6 Z" />
        </g>
      );
  }
}
