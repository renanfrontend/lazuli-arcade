import styles from './PugaThumbnail.module.css';

export function PugaThumbnail() {
  return (
    <div className={styles.wrap} aria-hidden="true">
      <div className={styles.bg} />
      <svg viewBox="0 0 120 120" className={styles.svg} fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="30" r="3" fill="#ffffff" opacity="0.8" />
        <circle cx="100" cy="40" r="4" fill="#ffffff" opacity="0.8" />
        <circle cx="85" cy="18" r="2.5" fill="#fde047" />

        <rect x="35" y="85" width="50" height="12" rx="6" fill="#22c55e" />
        <rect x="37" y="86" width="46" height="4" rx="2" fill="#86efac" />

        <path d="M55 85 Q60 78 65 85" stroke="#f59e0b" strokeWidth="3" fill="none" />

        <g transform="translate(42, 35)">
          <path d="M4 14 Q1 9 5 5 Q11 7 10 14 Z" fill="#1f2937" />
          <path d="M32 14 Q35 9 31 5 Q25 7 26 14 Z" fill="#1f2937" />
          <circle cx="18" cy="20" r="14" fill="#f59e0b" />
          <ellipse cx="18" cy="23" rx="10" ry="7" fill="#111827" />
          <circle cx="12" cy="17" r="3" fill="#ffffff" />
          <circle cx="13" cy="17" r="1.8" fill="#111827" />
          <circle cx="24" cy="17" r="3" fill="#ffffff" />
          <circle cx="23" cy="17" r="1.8" fill="#111827" />
          <path d="M16 26 Q18 31 20 28 Z" fill="#ef4444" />
        </g>

        <g transform="translate(50, 10)">
          <path
            d="M5 4 C3 4 2 2 4 1 C5 0 7 2 9 3 C11 2 13 0 14 1 C16 2 15 4 13 4 C15 4 16 6 14 7 C13 8 11 6 9 5 C7 6 5 8 4 7 C2 6 3 4 5 4 Z"
            fill="#fef08a"
          />
        </g>
      </svg>
    </div>
  );
}
