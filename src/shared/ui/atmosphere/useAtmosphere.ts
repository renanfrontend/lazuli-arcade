import { useEffect } from 'react';
import type { ArcadeServices } from '../../application/arcade';
export function useAtmosphere(services: ArcadeServices, enabled: boolean, kind: 'night' | 'garden'): void {
  useEffect(() => {
    if (!enabled) return undefined;
    const breathe = () => {
      if (document.visibilityState !== 'visible') return;
      const base = kind === 'garden' ? 174.61 : 65.41;
      services.audio.tone({ freq: base, duration: 5, gain: .025, type: 'sine' });
      services.audio.tone({ freq: base * 1.5, at: 1, duration: 4, gain: .018, type: 'sine' });
      if (kind === 'night') services.audio.noise({ duration: 1, gain: .045, filter: 'lowpass', freq: 240 });
    };
    breathe(); const timer = window.setInterval(breathe, 6500);
    return () => { window.clearInterval(timer); };
  }, [services, enabled, kind]);
}
