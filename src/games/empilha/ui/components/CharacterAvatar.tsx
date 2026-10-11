import type { CharacterId } from '../../domain/characters';
import styles from './CharacterAvatar.module.css';

interface CharacterAvatarProps {
  readonly characterId: CharacterId;
  readonly size?: number;
  readonly className?: string;
  readonly animated?: boolean;
}

export function CharacterAvatar({ characterId, size = 48, className = '', animated = true }: CharacterAvatarProps) {
  return (
    <div
      className={`${styles.avatarWrap} ${animated ? styles.animated : ''} ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        className={styles.svg}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {renderCharacterSvg(characterId)}
      </svg>
    </div>
  );
}

function renderCharacterSvg(id: CharacterId) {
  switch (id) {
    case 'tata':
      return (
        <g>
          <ellipse cx="32" cy="34" rx="24" ry="20" fill="#2b8a3e" />
          <ellipse cx="32" cy="34" rx="21" ry="17" fill="#40c057" />
          <path d="M32 20 L40 28 L32 36 L24 28 Z" fill="#2f9e44" stroke="#1b6d2a" strokeWidth="1.5" />
          <path d="M40 28 L49 32 L44 42 L32 36 Z" fill="#2b8a3e" stroke="#1b6d2a" strokeWidth="1.5" />
          <path d="M24 28 L15 32 L20 42 L32 36 Z" fill="#2b8a3e" stroke="#1b6d2a" strokeWidth="1.5" />
          <ellipse cx="14" cy="46" rx="5" ry="4" fill="#69db7c" />
          <ellipse cx="50" cy="46" rx="5" ry="4" fill="#69db7c" />
          <circle cx="32" cy="18" r="11" fill="#69db7c" />
          <circle cx="28" cy="16" r="2.8" fill="#182230" />
          <circle cx="27" cy="15" r="1" fill="#ffffff" />
          <circle cx="36" cy="16" r="2.8" fill="#182230" />
          <circle cx="35" cy="15" r="1" fill="#ffffff" />
          <ellipse cx="25" cy="20" rx="2" ry="1.2" fill="#ff8787" opacity="0.6" />
          <ellipse cx="39" cy="20" rx="2" ry="1.2" fill="#ff8787" opacity="0.6" />
          <path d="M29 21 Q32 24 35 21" stroke="#1b6d2a" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      );

    case 'rabito':
      return (
        <g>
          <ellipse cx="22" cy="15" rx="5.5" ry="13" fill="#f8f9fa" stroke="#e9ecef" strokeWidth="1" transform="rotate(-8 22 15)" />
          <ellipse cx="22" cy="15" rx="3" ry="9" fill="#ffc9c9" transform="rotate(-8 22 15)" />
          <ellipse cx="42" cy="15" rx="5.5" ry="13" fill="#f8f9fa" stroke="#e9ecef" strokeWidth="1" transform="rotate(10 42 15)" />
          <ellipse cx="42" cy="15" rx="3" ry="9" fill="#ffc9c9" transform="rotate(10 42 15)" />
          <circle cx="32" cy="38" r="19" fill="#ffffff" />
          <circle cx="25" cy="35" r="3.6" fill="#182230" />
          <circle cx="24" cy="33.5" r="1.3" fill="#ffffff" />
          <circle cx="39" cy="35" r="3.6" fill="#182230" />
          <circle cx="38" cy="33.5" r="1.3" fill="#ffffff" />
          <polygon points="32,41 29,38 35,38" fill="#ff8787" />
          <rect x="30" y="44" width="4" height="4.5" rx="1" fill="#f8f9fa" stroke="#ced4da" strokeWidth="0.8" />
          <line x1="16" y1="41" x2="25" y2="42" stroke="#adb5bd" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="15" y1="44" x2="25" y2="44" stroke="#adb5bd" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="48" y1="41" x2="39" y2="42" stroke="#adb5bd" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="49" y1="44" x2="39" y2="44" stroke="#adb5bd" strokeWidth="1.2" strokeLinecap="round" />
          <ellipse cx="23" cy="40" rx="3" ry="2" fill="#ffc9c9" opacity="0.8" />
          <ellipse cx="41" cy="40" rx="3" ry="2" fill="#ffc9c9" opacity="0.8" />
        </g>
      );

    case 'lobo':
      return (
        <g>
          <polygon points="17,32 12,12 28,24" fill="#495057" />
          <polygon points="17,29 15,16 25,24" fill="#343a40" />
          <polygon points="47,32 52,12 36,24" fill="#495057" />
          <polygon points="47,29 49,16 39,24" fill="#343a40" />
          <circle cx="32" cy="38" r="19" fill="#495057" />
          <polygon points="13,38 7,42 14,46" fill="#495057" />
          <polygon points="51,38 57,42 50,46" fill="#495057" />
          <ellipse cx="32" cy="42" rx="14" ry="11" fill="#adb5bd" />
          <ellipse cx="25" cy="34" rx="3.8" ry="3.2" fill="#fcc419" />
          <circle cx="25" cy="34" r="2" fill="#182230" />
          <circle cx="24" cy="33" r="0.8" fill="#ffffff" />
          <ellipse cx="39" cy="34" rx="3.8" ry="3.2" fill="#fcc419" />
          <circle cx="39" cy="34" r="2" fill="#182230" />
          <circle cx="38" cy="33" r="0.8" fill="#ffffff" />
          <ellipse cx="32" cy="44" rx="4" ry="3" fill="#212529" />
          <path d="M28 47 Q32 50 36 47" stroke="#212529" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      );

    case 'porquinha':
      return (
        <g>
          <polygon points="17,27 12,14 26,20" fill="#f06595" />
          <polygon points="17,25 14,16 23,20" fill="#ffdeeb" />
          <polygon points="47,27 52,14 38,20" fill="#f06595" />
          <polygon points="47,25 50,16 41,20" fill="#ffdeeb" />
          <circle cx="32" cy="37" r="19" fill="#fcc2d7" />
          <ellipse cx="24" cy="32" rx="3" ry="3.5" fill="#182230" />
          <circle cx="23" cy="31" r="1.1" fill="#ffffff" />
          <ellipse cx="40" cy="32" rx="3" ry="3.5" fill="#182230" />
          <circle cx="39" cy="31" r="1.1" fill="#ffffff" />
          <ellipse cx="32" cy="42" rx="9" ry="6.5" fill="#f06595" />
          <circle cx="28.5" cy="42" r="2" fill="#c2255c" />
          <circle cx="35.5" cy="42" r="2" fill="#c2255c" />
          <circle cx="19" cy="38" r="3.2" fill="#ff8787" opacity="0.75" />
          <circle cx="45" cy="38" r="3.2" fill="#ff8787" opacity="0.75" />
          <polygon points="44,17 50,13 48,22" fill="#d6336c" />
          <polygon points="44,17 50,21 44,21" fill="#d6336c" />
          <circle cx="44" cy="17" r="2" fill="#ffdeeb" />
        </g>
      );

    case 'puga':
      return (
        <g>
          <path d="M15 26 Q11 21 16 16 Q24 19 23 27 Z" fill="#343a40" />
          <path d="M49 26 Q53 21 48 16 Q40 19 41 27 Z" fill="#343a40" />
          <circle cx="32" cy="37" r="19" fill="#f59f00" />
          <path d="M28 22 Q32 20 36 22" stroke="#d9480f" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M26 26 Q32 24 38 26" stroke="#d9480f" strokeWidth="1.8" strokeLinecap="round" />
          <ellipse cx="32" cy="42" rx="13" ry="10" fill="#212529" />
          <circle cx="23" cy="33" r="4.5" fill="#212529" />
          <circle cx="23" cy="33" r="3.8" fill="#495057" />
          <circle cx="22" cy="31.5" r="1.6" fill="#ffffff" />
          <circle cx="24.5" cy="34" r="0.8" fill="#ffffff" />
          <circle cx="41" cy="33" r="4.5" fill="#212529" />
          <circle cx="41" cy="33" r="3.8" fill="#495057" />
          <circle cx="40" cy="31.5" r="1.6" fill="#ffffff" />
          <circle cx="42.5" cy="34" r="0.8" fill="#ffffff" />
          <polygon points="32,41 29,38 35,38" fill="#000000" />
          <path d="M30 46 Q32 52 35 49 Q35 46 32 46 Z" fill="#ff6b6b" />
        </g>
      );

    case 'elefantinho':
      return (
        <g>
          <ellipse cx="14" cy="35" rx="10" ry="13" fill="#74c0fc" />
          <ellipse cx="15" cy="35" rx="6" ry="9" fill="#d0ebff" />
          <ellipse cx="50" cy="35" rx="10" ry="13" fill="#74c0fc" />
          <ellipse cx="49" cy="35" rx="6" ry="9" fill="#d0ebff" />
          <circle cx="32" cy="36" r="18" fill="#74c0fc" />
          <circle cx="24" cy="31" r="3.2" fill="#182230" />
          <circle cx="23" cy="30" r="1.1" fill="#ffffff" />
          <circle cx="40" cy="31" r="3.2" fill="#182230" />
          <circle cx="39" cy="30" r="1.1" fill="#ffffff" />
          <path d="M25 43 Q23 48 21 46 Q24 43 25 43 Z" fill="#ffffff" stroke="#ced4da" strokeWidth="0.8" />
          <path d="M39 43 Q41 48 43 46 Q40 43 39 43 Z" fill="#ffffff" stroke="#ced4da" strokeWidth="0.8" />
          <path
            d="M30 38 Q32 48 37 49 Q42 48 42 42 Q40 42 39 44 Q36 45 34 38 Z"
            fill="#4dabf7"
            stroke="#1c7ed6"
            strokeWidth="1.2"
          />
          <circle cx="20" cy="38" rx="2.5" ry="1.8" fill="#ff8787" opacity="0.6" />
          <circle cx="44" cy="38" rx="2.5" ry="1.8" fill="#ff8787" opacity="0.6" />
        </g>
      );
  }
}
