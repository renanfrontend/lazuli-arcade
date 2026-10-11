export function MiniThumbnail({ kind }: { readonly kind: 'snake' | 'memory' | 'breakout' }) {
  const background = kind === 'snake' ? '#085c50' : kind === 'memory' ? '#a58af5' : '#122e6e';
  return <svg viewBox="0 0 320 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="320" height="150" fill={background} />
    {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={(i * 67 + 13) % 320} cy={(i * 31 + 9) % 150} r="2" fill="#ffffff" opacity=".15" />)}
    {kind === 'snake' && <>
      <path d="M76 116V57H125V93H191V47H233" fill="none" stroke="#043c36" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" transform="translate(0 5)" />
      <path d="M76 116V57H125V93H191V47H233" fill="none" stroke="#34d399" strokeWidth="23" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="216" y="33" width="33" height="28" rx="12" fill="#bbf7d0" /><circle cx="237" cy="41" r="3" fill="#064e3b" /><circle cx="237" cy="53" r="3" fill="#064e3b" />
      <path d="M259 84l16-10 16 10-16 23Z" fill="#ffc531" stroke="#fff0a6" strokeWidth="3" />
      <text x="38" y="33" fontSize="17" fill="#b5f5dc" fontWeight="900">+10 ✦</text>
    </>}
    {kind === 'memory' && <>
      <g transform="rotate(-13 115 80)"><rect x="66" y="21" width="85" height="116" rx="16" fill="#45248f" /><rect x="66" y="16" width="85" height="116" rx="16" fill="#fff8ed" stroke="#302054" strokeWidth="3" /><text x="108" y="88" textAnchor="middle" fontSize="51">🐶</text></g>
      <g transform="rotate(12 210 80)"><rect x="167" y="19" width="85" height="116" rx="16" fill="#45248f" /><rect x="167" y="14" width="85" height="116" rx="16" fill="#d1fae5" stroke="#302054" strokeWidth="3" /><text x="209" y="86" textAnchor="middle" fontSize="51">🐶</text></g>
      <text x="264" y="44" fill="#fff5b0" fontSize="27">✦</text>
    </>}
    {kind === 'breakout' && <>
      {Array.from({ length: 18 }, (_, i) => <rect key={i} x={37 + i % 6 * 42} y={18 + Math.floor(i / 6) * 22} width="36" height="16" rx="5" fill={['#c084fc', '#38bdf8', '#fbbf24'][Math.floor(i / 6)]} />)}
      <path d="M142 104L186 75" stroke="#93c5fd" strokeWidth="7" strokeLinecap="round" opacity=".25" /><circle cx="190" cy="72" r="8" fill="#fff" />
      <rect x="111" y="122" width="96" height="12" rx="6" fill="#022252" /><rect x="111" y="117" width="96" height="12" rx="6" fill="#38bdf8" />
      <text x="239" y="116" fontSize="18" fill="#fde68a">✦</text>
    </>}
  </svg>;
}
