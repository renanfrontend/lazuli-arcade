import { useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react';
import type { ArcadeServices } from '../../application/arcade';
import { readRecord, saveRecord } from '../../application/records';

export type Phase = 'ready' | 'playing' | 'paused' | 'over';

export function useGameRecord(services: ArcadeServices, namespace: string) {
  const store = useMemo(() => services.openStore(namespace), [services, namespace]);
  const [record, setRecord] = useState(() => readRecord(store));
  const finish = useCallback((score: number) => {
    setRecord(saveRecord(store, score));
  }, [store]);
  return { record, finish };
}

export function useGameKeys(onKey: (key: string) => boolean): void {
  const handle = useEffectEvent(onKey);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if ((event.key === ' ' || event.key === 'Enter') && target instanceof HTMLElement && target.closest('button, a')) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.repeat && (event.key === 'Escape' || event.key === ' ')) return;
      if (handle(event.key)) event.preventDefault();
    };
    window.addEventListener('keydown', listener);
    return () => { window.removeEventListener('keydown', listener); };
  }, []);
}

