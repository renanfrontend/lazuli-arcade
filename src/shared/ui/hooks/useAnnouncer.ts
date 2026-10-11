import { useCallback, useRef } from 'react';

/**
 * Polite live-region announcements. Clearing first and writing on the next tick makes
 * screen readers repeat identical messages ("Peça colocada." twice in a row).
 */
export const useAnnouncer = () => {
  const ref = useRef<HTMLParagraphElement | null>(null);
  const announce = useCallback((message: string) => {
    const region = ref.current;
    if (!region) return;
    region.textContent = '';
    window.setTimeout(() => {
      region.textContent = message;
    }, 40);
  }, []);
  return [ref, announce] as const;
};
