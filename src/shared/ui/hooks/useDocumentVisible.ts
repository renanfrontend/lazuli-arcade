import { useSyncExternalStore } from 'react';

const subscribe = (onChange: () => void) => {
  document.addEventListener('visibilitychange', onChange);
  return () => {
    document.removeEventListener('visibilitychange', onChange);
  };
};

const getSnapshot = () => document.visibilityState === 'visible';
const getServerSnapshot = () => true;

/** False while the tab or app is in the background, so real-time opponents can pause. */
export const useDocumentVisible = (): boolean => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
