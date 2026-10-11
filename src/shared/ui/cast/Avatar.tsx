import type { ReactNode } from 'react';
import { castMember, type CastId } from '@shared/cast/cast';

export type Mood = 'idle' | 'happy' | 'sad' | 'think';

interface AvatarProps {
  readonly id: CastId;
  readonly mood?: Mood;
  /** CSS size of the square drawing; defaults to the size of its container. */
  readonly size?: number | string;
  /** Decorative when something next to it already names the character. */
  readonly decorative?: boolean;
  readonly className?: string;
}

const INK = '#2a1f3d';
const BLUSH = '#ff8fa3';

/* ---------- face parts shared by every species ---------- */

interface FaceSpec {
  readonly eyeY: number;
  readonly eyeDx: number;
  readonly eyeR: number;
  readonly mouthY: number;
}

const Eyes = ({ mood, face }: { mood: Mood; face: FaceSpec }): ReactNode => {
  const xs = [50 - face.eyeDx, 50 + face.eyeDx];
  if (mood === 'happy') {
    return xs.map((x) => (
      <path
        key={x}
        d={`M${x - face.eyeR} ${face.eyeY + 1.5} Q${x} ${face.eyeY - face.eyeR * 1.5} ${x + face.eyeR} ${face.eyeY + 1.5}`}
        fill="none"
        stroke={INK}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    ));
  }
  const look = mood === 'think' ? 2 : 0;
  return xs.map((x, index) => (
    <g key={x}>
      <ellipse cx={x + look} cy={face.eyeY} rx={face.eyeR} ry={face.eyeR * 1.12} fill={INK} />
      <circle cx={x + look + face.eyeR * 0.35} cy={face.eyeY - face.eyeR * 0.4} r={face.eyeR * 0.34} fill="#fff" />
      {mood === 'sad' && (
        <path
          d={index === 0 ? `M${x - 6} ${face.eyeY - 8} L${x + 5} ${face.eyeY - 11}` : `M${x - 5} ${face.eyeY - 11} L${x + 6} ${face.eyeY - 8}`}
          stroke={INK}
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      )}
    </g>
  ));
};

const Mouth = ({ mood, y, ink = INK }: { mood: Mood; y: number; ink?: string }): ReactNode => {
  switch (mood) {
    case 'happy':
      return <path d={`M42 ${y - 2} Q50 ${y + 11} 58 ${y - 2} Z`} fill="#7a2a3a" stroke={ink} strokeWidth="2.2" strokeLinejoin="round" />;
    case 'sad':
      return <path d={`M43 ${y + 4} Q50 ${y - 3} 57 ${y + 4}`} fill="none" stroke={ink} strokeWidth="2.8" strokeLinecap="round" />;
    case 'think':
      return <path d={`M45 ${y + 1} L56 ${y - 1}`} fill="none" stroke={ink} strokeWidth="2.8" strokeLinecap="round" />;
    case 'idle':
      return <path d={`M43 ${y - 1} Q50 ${y + 6} 57 ${y - 1}`} fill="none" stroke={ink} strokeWidth="2.8" strokeLinecap="round" />;
  }
};

const Cheeks = ({ y, dx = 21 }: { y: number; dx?: number }) => (
  <>
    <ellipse cx={50 - dx} cy={y} rx="5.5" ry="3.6" fill={BLUSH} opacity="0.55" />
    <ellipse cx={50 + dx} cy={y} rx="5.5" ry="3.6" fill={BLUSH} opacity="0.55" />
  </>
);

const Outline = ({ children }: { children: ReactNode }) => (
  <g stroke={INK} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round">
    {children}
  </g>
);

/* ---------- species ---------- */

interface Species {
  readonly face: FaceSpec;
  /** Drawn behind the head (ears, shell…) and in front of it (muzzle, nose…). */
  readonly Back: () => ReactNode;
  readonly Front: (props: { mood: Mood }) => ReactNode;
  readonly cheeks?: number;
}

const FACE: FaceSpec = { eyeY: 52, eyeDx: 15, eyeR: 4.8, mouthY: 68 };

const SPECIES: Record<CastId, Species> = {
  tata: {
    face: { ...FACE, eyeY: 58, mouthY: 73 },
    cheeks: 65,
    Back: () => (
      <Outline>
        <path d="M14 56 Q14 14 50 14 Q86 14 86 56 Z" fill="#8a6a3a" />
        <path d="M30 56 L34 34 L50 26 L66 34 L70 56 M50 26 V56 M34 34 L50 44 L66 34" fill="none" stroke="#5e4524" strokeWidth="2.4" />
      </Outline>
    ),
    Front: () => (
      <Outline>
        <ellipse cx="50" cy="64" rx="31" ry="27" fill="#7fd08a" />
        <ellipse cx="31" cy="46" rx="0.1" ry="0.1" />
      </Outline>
    ),
  },
  porquinho: {
    face: { ...FACE, eyeY: 46, eyeDx: 17 },
    cheeks: 56,
    Back: () => (
      <Outline>
        <path d="M18 34 L22 8 L44 22 Z" fill="#f4a0bd" />
        <path d="M82 34 L78 8 L56 22 Z" fill="#f4a0bd" />
      </Outline>
    ),
    Front: () => (
      <>
        <Outline>
          <circle cx="50" cy="52" r="36" fill="#f8b6cc" />
          <ellipse cx="50" cy="66" rx="15" ry="11" fill="#f08fb0" />
        </Outline>
        <ellipse cx="44" cy="66" rx="2.6" ry="3.6" fill="#a8456b" />
        <ellipse cx="56" cy="66" rx="2.6" ry="3.6" fill="#a8456b" />
      </>
    ),
  },
  elefantinho: {
    face: { ...FACE, eyeY: 48, eyeDx: 14, eyeR: 4.2 },
    cheeks: 58,
    Back: () => (
      <Outline>
        <circle cx="18" cy="46" r="17" fill="#8fb2e6" />
        <circle cx="82" cy="46" r="17" fill="#8fb2e6" />
        <circle cx="18" cy="46" r="9" fill="#e9a9c0" stroke="none" />
        <circle cx="82" cy="46" r="9" fill="#e9a9c0" stroke="none" />
      </Outline>
    ),
    Front: () => (
      <Outline>
        <ellipse cx="50" cy="50" rx="30" ry="32" fill="#a9c6f0" />
        <path d="M43 62 Q43 84 52 88 Q60 90 61 82 Q61 78 57 78 Q54 78 54 72 L57 62 Z" fill="#a9c6f0" />
        <path d="M45 72 H55 M46 78 H54" stroke={INK} strokeWidth="1.6" fill="none" opacity="0.5" />
      </Outline>
    ),
  },
  puga: {
    face: { ...FACE, eyeY: 50, eyeDx: 16, eyeR: 5.4, mouthY: 70 },
    cheeks: 60,
    Back: () => (
      <Outline>
        <path d="M14 30 Q8 54 24 60 Q32 42 28 22 Z" fill="#3b2f2f" />
        <path d="M86 30 Q92 54 76 60 Q68 42 72 22 Z" fill="#3b2f2f" />
      </Outline>
    ),
    Front: () => (
      <>
        <Outline>
          <circle cx="50" cy="52" r="35" fill="#e8c28a" />
        </Outline>
        <ellipse cx="50" cy="63" rx="19" ry="16" fill="#4a3b36" />
        <ellipse cx="34" cy="50" rx="10" ry="9.5" fill="#4a3b36" />
        <ellipse cx="66" cy="50" rx="10" ry="9.5" fill="#4a3b36" />
        <path d="M40 30 Q50 25 60 30 M43 35 Q50 32 57 35" fill="none" stroke="#a9794a" strokeWidth="2.4" strokeLinecap="round" />
        <ellipse cx="50" cy="61" rx="5.6" ry="3.8" fill={INK} />
      </>
    ),
  },
  rabito: {
    face: { ...FACE, eyeY: 56, eyeDx: 15, mouthY: 72 },
    cheeks: 64,
    Back: () => (
      <Outline>
        <ellipse cx="34" cy="22" rx="9" ry="21" fill="#d7c8fa" transform="rotate(-8 34 22)" />
        <ellipse cx="66" cy="22" rx="9" ry="21" fill="#d7c8fa" transform="rotate(8 66 22)" />
        <ellipse cx="34" cy="23" rx="4" ry="14" fill="#f7b9d0" stroke="none" transform="rotate(-8 34 23)" />
        <ellipse cx="66" cy="23" rx="4" ry="14" fill="#f7b9d0" stroke="none" transform="rotate(8 66 23)" />
      </Outline>
    ),
    Front: () => (
      <>
        <Outline>
          <ellipse cx="50" cy="64" rx="35" ry="30" fill="#ece4ff" />
        </Outline>
        <path d="M46 66 L54 66 L50 71 Z" fill="#f08fb0" />
        <path d="M22 66 L35 68 M22 73 L35 72 M78 66 L65 68 M78 73 L65 72" stroke={INK} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
        <path d="M46 78 V84 H54 V78" fill="#fff" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      </>
    ),
  },
  raposa: {
    face: { ...FACE, eyeY: 50, eyeDx: 17, eyeR: 4.4, mouthY: 70 },
    cheeks: 60,
    Back: () => (
      <Outline>
        <path d="M14 46 L16 8 L44 24 Z" fill="#f08a3c" />
        <path d="M86 46 L84 8 L56 24 Z" fill="#f08a3c" />
        <path d="M20 36 L21 18 L35 27 Z" fill="#3b2a2a" stroke="none" />
        <path d="M80 36 L79 18 L65 27 Z" fill="#3b2a2a" stroke="none" />
      </Outline>
    ),
    Front: () => (
      <>
        <Outline>
          <path d="M50 88 Q10 76 12 46 Q16 24 50 24 Q84 24 88 46 Q90 76 50 88 Z" fill="#f59a4c" />
        </Outline>
        <path d="M50 88 Q22 80 14 52 Q30 62 50 62 Q70 62 86 52 Q78 80 50 88 Z" fill="#fff6ea" />
        <path d="M44 64 Q50 60 56 64 Q56 70 50 72 Q44 70 44 64 Z" fill={INK} />
      </>
    ),
  },
  lobo: {
    face: { ...FACE, eyeY: 48, eyeDx: 15, eyeR: 4.2, mouthY: 72 },
    cheeks: 60,
    Back: () => (
      <Outline>
        <path d="M16 44 L18 6 L46 22 Z" fill="#6c7f9e" />
        <path d="M84 44 L82 6 L54 22 Z" fill="#6c7f9e" />
        <path d="M23 34 L24 17 L36 25 Z" fill="#c7d2e6" stroke="none" />
        <path d="M77 34 L76 17 L64 25 Z" fill="#c7d2e6" stroke="none" />
      </Outline>
    ),
    Front: () => (
      <>
        <Outline>
          <path d="M50 90 Q8 76 12 44 Q18 22 50 22 Q82 22 88 44 Q92 76 50 90 Z" fill="#8497b8" />
        </Outline>
        <path d="M50 90 Q30 84 28 64 Q38 58 50 60 Q62 58 72 64 Q70 84 50 90 Z" fill="#dfe7f5" />
        <path d="M43 62 Q50 57 57 62 Q57 69 50 71 Q43 69 43 62 Z" fill={INK} />
        <path d="M12 56 L22 60 L13 66 M88 56 L78 60 L87 66" fill="none" stroke="#5a6c8c" strokeWidth="2.2" strokeLinejoin="round" />
      </>
    ),
  },
  coruja: {
    face: { eyeY: 46, eyeDx: 17, eyeR: 6.2, mouthY: 70 },
    cheeks: 60,
    Back: () => (
      <Outline>
        <path d="M20 30 L14 6 L38 20 Z" fill="#7a5a47" />
        <path d="M80 30 L86 6 L62 20 Z" fill="#7a5a47" />
      </Outline>
    ),
    Front: () => (
      <>
        <Outline>
          <path d="M50 92 Q10 82 12 48 Q14 20 50 20 Q86 20 88 48 Q90 82 50 92 Z" fill="#9a7660" />
        </Outline>
        <path d="M50 92 Q30 86 28 70 Q40 62 50 66 Q60 62 72 70 Q70 86 50 92 Z" fill="#e7d3b8" />
        <circle cx="33" cy="46" r="14" fill="#fff4d6" stroke={INK} strokeWidth="2.4" />
        <circle cx="67" cy="46" r="14" fill="#fff4d6" stroke={INK} strokeWidth="2.4" />
        <path d="M44 56 L56 56 L50 67 Z" fill="#f2a93b" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
        <path d="M38 78 Q42 74 46 78 M54 78 Q58 74 62 78" fill="none" stroke="#9a7660" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
  },
};

/** A cast member's face. Original artwork, drawn in SVG so it scales and themes with the page. */
export function Avatar({ id, mood = 'idle', size = '100%', decorative = false, className }: AvatarProps) {
  const species = SPECIES[id];
  const { face } = species;
  const owl = id === 'coruja';
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : castMember(id).name}
      aria-hidden={decorative ? true : undefined}
      focusable="false"
    >
      <species.Back />
      <species.Front mood={mood} />
      {owl ? (
        <g>
          {[33, 67].map((x) => (
            <g key={x}>
              {mood === 'happy' ? (
                <path d={`M${x - 6} 48 Q${x} 38 ${x + 6} 48`} fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
              ) : (
                <>
                  <circle cx={x + (mood === 'think' ? 2 : 0)} cy="47" r="6.4" fill={INK} />
                  <circle cx={x + (mood === 'think' ? 2 : 0) + 2} cy="44.5" r="2" fill="#fff" />
                </>
              )}
            </g>
          ))}
          {mood === 'sad' && <path d="M24 33 L40 37 M76 33 L60 37" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />}
        </g>
      ) : (
        <>
          <Eyes mood={mood} face={face} />
          {species.cheeks !== undefined && <Cheeks y={species.cheeks} dx={id === 'rabito' ? 24 : 22} />}
          {id !== 'raposa' && id !== 'lobo' && id !== 'puga' && id !== 'elefantinho' && <Mouth mood={mood} y={face.mouthY} />}
          {(id === 'raposa' || id === 'lobo') && <Mouth mood={mood} y={id === 'raposa' ? 78 : 80} />}
          {id === 'puga' && <Mouth mood={mood} y={73} ink="#fbeedb" />}
        </>
      )}
    </svg>
  );
}
