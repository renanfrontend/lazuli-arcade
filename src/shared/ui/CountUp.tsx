import { useEffect, useRef, useState } from 'react';
import { formatNumber } from './format';

interface CountUpProps {
  readonly value: number;
  readonly className?: string | undefined;
  /** Wait before counting up, e.g. while coins are still flying to the counter. */
  readonly delayUp?: number;
  readonly duration?: number;
  readonly reducedMotion: boolean;
}

/**
 * Animated number that writes straight to the DOM: a count-up at 60fps should
 * not re-render React. React only renders the initial text, never touched again.
 */
export function CountUp({ value, className, delayUp = 0, duration = 650, reducedMotion }: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const shown = useRef(value);
  const [initialText] = useState(() => formatNumber(value));

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const from = shown.current;
    if (from === value || reducedMotion) {
      shown.current = value;
      element.textContent = formatNumber(value);
      return;
    }

    let frame = 0;
    const startAt = performance.now() + (value > from ? delayUp : 0);
    const tick = (now: number) => {
      const progress = Math.min(1, Math.max(0, (now - startAt) / duration));
      const eased = 1 - (1 - progress) ** 3;
      shown.current = Math.round(from + (value - from) * eased);
      element.textContent = formatNumber(shown.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [value, delayUp, duration, reducedMotion]);

  return (
    <span ref={ref} className={className} aria-hidden="true">
      {initialText}
    </span>
  );
}
