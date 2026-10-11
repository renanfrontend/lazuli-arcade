import type { Viewport } from './useSceneCanvas';
export function cover(ctx: CanvasRenderingContext2D, image: HTMLImageElement | null, view: Viewport): void {
  ctx.fillStyle = '#070f1c'; ctx.fillRect(0, 0, view.width, view.height);
  if (!image?.complete || !image.naturalWidth) return;
  const scale = Math.max(view.width / image.naturalWidth, view.height / image.naturalHeight);
  ctx.drawImage(image, (view.width - image.naturalWidth * scale) / 2, (view.height - image.naturalHeight * scale) / 2, image.naturalWidth * scale, image.naturalHeight * scale);
}
export function glow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, alpha = 1): void {
  ctx.save(); ctx.globalAlpha = alpha;
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius); gradient.addColorStop(0, `${color}bb`); gradient.addColorStop(.2, `${color}55`); gradient.addColorStop(1, `${color}00`);
  ctx.fillStyle = gradient; ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2); ctx.restore();
}
export function vignette(ctx: CanvasRenderingContext2D, view: Viewport, alpha: number): void {
  const g = ctx.createRadialGradient(view.width / 2, view.height / 2, view.height * .12, view.width / 2, view.height / 2, Math.max(view.width, view.height) * .65);
  g.addColorStop(0, '#02081500'); g.addColorStop(1, `rgba(1,5,12,${alpha})`); ctx.fillStyle = g; ctx.fillRect(0, 0, view.width, view.height);
}
