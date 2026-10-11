import { useId, useState, type KeyboardEvent } from 'react';
import { Dialog } from '@shared/ui/Dialog';
import scene from '@shared/ui/atmosphere/Scene.module.css';
import { FLOORPLAN, LOCKERS, MELODY, MELODY_COLORS, NOTES, RELICS, SAFE, SAFE_CODE, type MelodyColor } from '../domain/game';
import styles from './Night.module.css';

/** What the game decided about a submitted answer. */
export type Verdict = 'ok' | 'wrong' | 'alarm';

const SWATCH: Readonly<Record<MelodyColor, string>> = { vermelho: '#c0392b', branco: '#ece4d2', amarelo: '#e1b83a', azul: '#2f5fa8' };
const TONE: Readonly<Record<MelodyColor, number>> = { vermelho: 392, branco: 523.25, amarelo: 659.25, azul: 440 };

interface SheetProps { readonly title: string; readonly onClose: () => void; readonly children: React.ReactNode }
function Sheet({ title, onClose, children }: SheetProps) {
  const id = useId();
  return (
    <Dialog open labelledBy={id} onCancel={onClose}>
      <div className={styles.sheet}>
        <h2 id={id}>{title}</h2>
        {children}
        <button type="button" className={scene.secondary} onClick={onClose}>Fechar</button>
      </div>
    </Dialog>
  );
}

export function NoteSheet({ index, onClose }: { readonly index: number; readonly onClose: () => void }) {
  const note = NOTES[index];
  if (!note) return null;
  return (
    <Sheet title={note.title} onClose={onClose}>
      <p className={styles.paper}>{note.text}</p>
      <span className={styles.room}>{note.room} · guardado no diário</span>
    </Sheet>
  );
}

interface SafeSheetProps { readonly mistakes: number; readonly onSubmit: (code: readonly number[]) => Verdict; readonly onClose: () => void }
export function SafeSheet({ mistakes, onSubmit, onClose }: SafeSheetProps) {
  const [digits, setDigits] = useState<readonly number[]>([]);
  const [message, setMessage] = useState('');
  const push = (digit: number) => {
    setMessage('');
    setDigits(current => (current.length < SAFE_CODE.length ? [...current, digit] : current));
  };
  const submit = () => {
    const verdict = onSubmit(digits);
    if (verdict === 'wrong') {
      setDigits([]);
      setMessage('Errado. O estalo ecoou pela casa.');
    }
  };
  const keys = (event: KeyboardEvent) => {
    if (/^\d$/.test(event.key)) push(Number(event.key));
    else if (event.key === 'Backspace') setDigits(current => current.slice(0, -1));
    else return;
    event.preventDefault();
  };
  return (
    <Sheet title="Cofre do camarim" onClose={onClose}>
      <div onKeyDown={keys} className={styles.keypad}>
        <div className={styles.display} role="status" aria-label={`Código: ${digits.length} de ${SAFE_CODE.length} algarismos`}>
          {SAFE_CODE.map((_, i) => <span key={i} data-filled={digits[i] !== undefined}>{digits[i] ?? '·'}</span>)}
        </div>
        <div className={styles.keys}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => <button key={d} type="button" onClick={() => { push(d); }}>{d}</button>)}
          <button type="button" aria-label="Apagar" onClick={() => { setDigits(current => current.slice(0, -1)); }}>⌫</button>
          <button type="button" onClick={() => { push(0); }}>0</button>
          <button type="button" className={styles.confirm} disabled={digits.length !== SAFE_CODE.length} onClick={submit}>Abrir</button>
        </div>
        <p className={styles.warn} role="alert">{message || (mistakes > 0 ? `Cada erro faz barulho: ${mistakes} de 3.` : 'Os algarismos estão nos bilhetes da casa.')}</p>
      </div>
    </Sheet>
  );
}

interface MelodySheetProps { readonly mistakes: number; readonly onTone: (freq: number) => void; readonly onSubmit: (tune: readonly MelodyColor[]) => Verdict; readonly onClose: () => void }
export function MelodySheet({ mistakes, onTone, onSubmit, onClose }: MelodySheetProps) {
  const [tune, setTune] = useState<readonly MelodyColor[]>([]);
  const [message, setMessage] = useState('');
  const push = (color: MelodyColor) => {
    setMessage('');
    onTone(TONE[color]);
    setTune(current => (current.length < MELODY.length ? [...current, color] : current));
  };
  const submit = () => {
    const verdict = onSubmit(tune);
    if (verdict === 'wrong') {
      setTune([]);
      setMessage('A caixa engasgou. A ordem não é essa.');
    }
  };
  return (
    <Sheet title="Caixa de música" onClose={onClose}>
      <div className={styles.keypad}>
        <div className={styles.display} role="status" aria-label={`Melodia: ${tune.length} de ${MELODY.length} teclas`}>
          {MELODY.map((_, i) => { const color = tune[i]; return <span key={i} data-filled={color !== undefined} style={color ? { background: SWATCH[color], color: '#111' } : undefined}>{color ? color[0]?.toUpperCase() : '·'}</span>; })}
        </div>
        <div className={styles.colors}>
          {MELODY_COLORS.map(color => <button key={color} type="button" onClick={() => { push(color); }}><i style={{ background: SWATCH[color] }} />{color}</button>)}
        </div>
        <div className={styles.row}>
          <button type="button" className={scene.secondary} onClick={() => { setTune(current => current.slice(0, -1)); }}>Apagar</button>
          <button type="button" className={styles.confirm} disabled={tune.length !== MELODY.length} onClick={submit}>Tocar</button>
        </div>
        <p className={styles.warn} role="alert">{message || (mistakes > 0 ? `Cada erro faz barulho: ${mistakes} de 3.` : 'Duas pistas na casa dizem a ordem das quatro teclas.')}</p>
      </div>
    </Sheet>
  );
}

interface JournalProps {
  readonly read: readonly boolean[]; readonly collected: readonly boolean[]; readonly hasKey: boolean; readonly safeOpen: boolean;
  readonly x: number; readonly z: number; readonly yaw: number; readonly onClose: () => void;
}
export function JournalSheet({ read, collected, hasKey, safeOpen, x, z, yaw, onClose }: JournalProps) {
  const found = read.filter(Boolean).length;
  return (
    <Sheet title="Diário" onClose={onClose}>
      <svg className={styles.sheetMap} viewBox="0 0 38 42" role="img" aria-label={`Planta da mansão com ${LOCKERS.length} armários marcados em azul. Você: branco. Peças: ouro. Cofre: cinza.`}>
        {FLOORPLAN.map((row, rz) => Array.from(row, (cell, cx) => <rect key={`${cx}:${rz}`} x={cx * 2} y={rz * 2} width="2" height="2" fill={cell === '#' ? '#0d0b0b' : '#6d6259'} />))}
        {LOCKERS.map(l => <rect key={`${l.x}:${l.z}`} x={l.x - .7} y={l.z - .7} width="1.4" height="1.4" fill="#6f9bd6" />)}
        {RELICS.map((p, i) => !collected[i] && <circle key={p.name} cx={p.x} cy={p.z} r=".8" fill="#e8bc73" />)}
        {!safeOpen && <rect x={SAFE.x - .8} y={SAFE.z - .8} width="1.6" height="1.6" fill="#c9ccd3" />}
        <rect x="18" y="39" width="2" height="1" fill="#a8cbad" />
        <circle cx={x} cy={z} r=".75" fill="white" />
        <path d="M0,-2 L-.6,-.8 L.6,-.8Z" fill="white" transform={`translate(${x} ${z}) rotate(${yaw * 180 / Math.PI})`} />
      </svg>
      <ul className={styles.status2}>
        <li data-done={hasKey}>{hasKey ? '✦' : '◇'} Chavinha</li>
        <li data-done={safeOpen}>{safeOpen ? '✦' : '◇'} Cofre do camarim</li>
        <li data-done={found === NOTES.length}>{found === NOTES.length ? '✦' : '◇'} Bilhetes {found}/{NOTES.length}</li>
      </ul>
      <div className={styles.notes}>
        {NOTES.map((n, i) => read[i] ? <article key={n.title}><strong>{n.title}</strong><p>{n.text}</p></article> : <article key={n.title} data-unread="true"><strong>Bilhete não encontrado</strong><p>Algo escrito em algum cômodo.</p></article>)}
      </div>
    </Sheet>
  );
}
