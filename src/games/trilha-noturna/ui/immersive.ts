import { useEffect, useSyncExternalStore } from 'react';

/** Browser support varies (iOS Safari has no page fullscreen, desktop ignores the lock), so every member is optional. */
interface FullscreenRoot {
  requestFullscreen?: () => Promise<void>;
  webkitRequestFullscreen?: () => Promise<void> | void;
}
interface FullscreenDoc {
  fullscreenElement?: Element | null;
  webkitFullscreenElement?: Element | null;
  exitFullscreen?: () => Promise<void>;
  webkitExitFullscreen?: () => Promise<void> | void;
}
interface Orientation {
  lock?: (orientation: 'landscape') => Promise<void>;
  unlock?: () => void;
}

const PORTRAIT = '(orientation: portrait)';

const subscribePortrait = (notify: () => void) => {
  const query = window.matchMedia(PORTRAIT);
  query.addEventListener('change', notify);
  return () => {
    query.removeEventListener('change', notify);
  };
};

/** True while the device is held upright. Re-evaluates on rotation. */
export const useIsPortrait = (): boolean =>
  useSyncExternalStore(
    subscribePortrait,
    () => window.matchMedia(PORTRAIT).matches,
    () => false,
  );

const fullscreenElement = (doc: FullscreenDoc) => doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
const orientation = (): Orientation | undefined => (screen as { orientation?: Orientation }).orientation;

/**
 * Real fullscreen plus a landscape lock while `active`. Each step is best effort: iOS Safari has no
 * Fullscreen API for pages and Firefox/desktop ignore the orientation lock, so the stage also fills
 * the viewport with CSS (`data-immersive`) and a rotate prompt covers the portrait case.
 */
export const useImmersive = (active: boolean, lockLandscape: boolean): void => {
  useEffect(() => {
    if (!active) return undefined;
    const root: FullscreenRoot = document.documentElement;
    const doc: FullscreenDoc = document;
    const enter = async () => {
      try {
        if (!fullscreenElement(doc)) await (root.requestFullscreen?.() ?? root.webkitRequestFullscreen?.());
        if (lockLandscape) await orientation()?.lock?.('landscape');
      } catch {
        // Unsupported or refused (no user gesture): the CSS fallback already covers it.
      }
    };
    void enter();
    return () => {
      try {
        orientation()?.unlock?.();
        if (fullscreenElement(doc)) void (doc.exitFullscreen?.() ?? doc.webkitExitFullscreen?.());
      } catch {
        // Already left fullscreen.
      }
    };
  }, [active, lockLandscape]);
};
