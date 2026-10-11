import { useRef, type PointerEvent } from 'react';
import styles from './Night.module.css';
import { stickVector, type StickVector } from './stick';

interface JoystickProps {
  readonly onChange: (vector: StickVector) => void;
  readonly disabled?: boolean;
}

export function Joystick({ onChange, disabled = false }: JoystickProps) {
  const base = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  const active = useRef<number | null>(null);

  const place = (event: PointerEvent<HTMLDivElement>) => {
    const element = base.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const radius = rect.width / 2 - 26;
    let dx = event.clientX - (rect.left + rect.width / 2);
    let dy = event.clientY - (rect.top + rect.height / 2);
    const length = Math.hypot(dx, dy);
    if (length > radius) {
      dx = (dx / length) * radius;
      dy = (dy / length) * radius;
    }
    if (thumb.current) thumb.current.style.transform = `translate(${dx}px, ${dy}px)`;
    onChange(stickVector(dx, dy, radius));
  };
  const release = (event: PointerEvent<HTMLDivElement>) => {
    if (active.current !== event.pointerId) return;
    active.current = null;
    if (thumb.current) thumb.current.style.transform = 'translate(0px, 0px)';
    onChange({ x: 0, y: 0 });
  };

  return (
    <div
      ref={base}
      className={styles.stick}
      role="group"
      aria-label="Direcional analógico: arraste para andar"
      data-disabled={disabled}
      onPointerDown={event => {
        if (disabled || active.current !== null) return;
        active.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        place(event);
      }}
      onPointerMove={event => {
        if (active.current === event.pointerId) place(event);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
    >
      <span className={styles.stickRing} aria-hidden="true" />
      <span ref={thumb} className={styles.stickThumb} aria-hidden="true" />
    </div>
  );
}
