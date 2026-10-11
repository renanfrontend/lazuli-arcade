import { useCallback, useEffect, useEffectEvent, useState } from 'react';

const TICK_MS = 800;
const GO_MS = 560;

/**
 * 3 → 2 → 1 → 0 ("Já!") → null. `onStep` fires once per value, for sound. Play opens on "Já!",
 * so `blocking` is true only while numbers are showing.
 */
export const useCountdown = (startActive: boolean, onStep: (value: number) => void) => {
  const [value, setValue] = useState<number | null>(startActive ? 3 : null);
  const step = useEffectEvent(onStep);

  useEffect(() => {
    if (value === null) return;
    step(value);
    const timer = window.setTimeout(
      () => {
        setValue((current) => (current === null || current === 0 ? null : current - 1));
      },
      value === 0 ? GO_MS : TICK_MS,
    );
    return () => {
      window.clearTimeout(timer);
    };
  }, [value]);

  const start = useCallback(() => {
    setValue(3);
  }, []);

  return { value, blocking: value !== null && value > 0, start };
};
