import { useEffect, useEffectEvent, useRef } from 'react';
export interface Viewport { readonly width: number; readonly height: number }
export function useSceneCanvas(draw: (ctx: CanvasRenderingContext2D, viewport: Viewport, dt: number, time: number) => void) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useEffectEvent(draw);
  useEffect(() => {
    const canvas = canvasRef.current, ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;
    let width = 1, height = 1, dpr = 1, raf = 0, previous = performance.now();
    const resize = () => {
      const rect = canvas.getBoundingClientRect(); width = Math.max(1, rect.width); height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5); canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    };
    const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
    const render = (now: number) => {
      const dt = Math.min((now - previous) / 1000, .05); previous = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (document.visibilityState === 'visible') frame(ctx, { width, height }, dt, now / 1000);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => { observer.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  return canvasRef;
}
