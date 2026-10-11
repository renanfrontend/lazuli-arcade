import { useSyncExternalStore } from 'react';

const SLUG = /^[a-z0-9-]+$/;

/** `#lazuli-blocks` → `lazuli-blocks`; anything that is not a plain slug means the lobby. */
export const parseRoute = (hash: string): string | null => {
  const id = hash.replace(/^#\/?/, '').trim();
  return SLUG.test(id) ? id : null;
};

const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  return () => {
    window.removeEventListener('hashchange', onChange);
  };
};

const getSnapshot = () => parseRoute(window.location.hash);
const getServerSnapshot = () => null;

/** Current game id from the URL hash, or null for the lobby. Hash routes survive any static host. */
export const useRoute = (): string | null => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

let enteredFromLobby = false;

/** Call when a lobby link opens a game, so leaving can rewind history instead of stacking entries. */
export const markEnteredFromLobby = (): void => {
  enteredFromLobby = true;
};

export const exitToLobby = (): void => {
  if (enteredFromLobby) {
    // The previous entry is the lobby we pushed, so the device back gesture and this button agree.
    enteredFromLobby = false;
    window.history.back();
    return;
  }
  // Opened through a deep link: there is no lobby entry to rewind to (and inside an embed,
  // history.back() could leave the page), so navigate forward instead.
  window.location.hash = '';
};
