import { clamp, distance, EXIT, litBeacons, WORLD, type NightState, type Point } from '../domain/game';
import { glow, vignette } from '@shared/ui/atmosphere/paint';
import type { Viewport } from '@shared/ui/atmosphere/useSceneCanvas';
export interface Camera { readonly scale: number; readonly x: number; readonly y: number }
export function nightCamera(state: NightState, view: Viewport): Camera {
  const scale = Math.max(view.width / WORLD.width, view.height / WORLD.height);
  const cx = clamp(state.player.x, view.width / (2 * scale), WORLD.width - view.width / (2 * scale));
  const cy = clamp(state.player.y, view.height / (2 * scale), WORLD.height - view.height / (2 * scale));
  return { scale, x: view.width / 2 - cx * scale, y: view.height / 2 - cy * scale };
}
export function drawNight(ctx: CanvasRenderingContext2D, state: NightState, image: HTMLImageElement | null, view: Viewport, time: number, reduced: boolean, target: Point | null): Camera {
  const camera = nightCamera(state, view), {scale, x, y} = camera;
  ctx.fillStyle = '#071019'; ctx.fillRect(0, 0, view.width, view.height);
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  if (image?.complete && image.naturalWidth) ctx.drawImage(image, 0, 0, WORLD.width, WORLD.height);
  ctx.fillStyle = '#04101c4a'; ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  const t = reduced ? 0 : time;
  // Slow, broad mist bands preserve legibility of the ground.
  for (let i = 0; i < 4; i++) {
    const fy = 220 + i * 165 + Math.sin(t * .17 + i) * 25;
    const fog = ctx.createRadialGradient(650 + Math.sin(t * .1 + i) * 220, fy, 0, 650, fy, 680);
    fog.addColorStop(0, '#aecddb0c'); fog.addColorStop(1, '#aecddb00'); ctx.fillStyle = fog; ctx.fillRect(0, fy - 100, WORLD.width, 210);
  }
  for (let i = 0; i < 32; i++) {
    const fx = 300 + (i * 137.31) % 1020 + Math.sin(t * .32 + i * 3) * 15;
    const fy = 200 + (i * 93.17) % 600 + Math.cos(t * .24 + i) * 10;
    const alpha = .18 + .28 * Math.sin(t * .9 + i) ** 2;
    glow(ctx, fx, fy, 10, '#b9d8ce', alpha); ctx.fillStyle = `rgba(210,238,220,${alpha})`; ctx.fillRect(fx, fy, 1.7, 1.7);
  }
  state.beacons.forEach((beacon, index) => {
    const awake = beacon.charge >= 1, near = distance(state.player, beacon) < 100;
    const breathe = 1 + Math.sin(t * 1.7 + index) * .1;
    glow(ctx, beacon.x, beacon.y, (awake ? 128 : 68) * breathe, awake ? '#ffc990' : '#94cee1', awake ? .85 : .48);
    ctx.save(); ctx.translate(beacon.x, beacon.y); ctx.fillStyle = '#0b131ecc'; ctx.beginPath(); ctx.ellipse(0, 12, 19, 9, 0, 0, Math.PI * 2); ctx.fill();
    // A small, hand-built stone shrine around a floating flame.
    ctx.fillStyle = '#647b88'; ctx.beginPath(); ctx.moveTo(-14, 12); ctx.lineTo(-11, 0); ctx.lineTo(10, 0); ctx.lineTo(15, 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = awake ? '#ffdb9c' : '#b7e9f5'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = awake ? 22 : 12;
    ctx.beginPath(); ctx.ellipse(0, -9 + Math.sin(t * 2 + index) * 3, awake ? 6 : 3.5, awake ? 11 : 6, .12, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    if (beacon.charge > 0 && !awake) { ctx.strokeStyle = '#f2d49b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 2, 28, -Math.PI / 2, -Math.PI / 2 + beacon.charge * Math.PI * 2); ctx.stroke(); }
    if (near && !awake) { ctx.fillStyle = '#e0f3ff'; ctx.font = '13px system-ui'; ctx.textAlign = 'center'; ctx.fillText('Despertando…', 0, -42); }
    ctx.restore();
  });
  const complete = litBeacons(state) === state.beacons.length;
  glow(ctx, EXIT.x, EXIT.y, complete ? 150 : 60, complete ? '#f5d6a1' : '#86aebe', complete ? .9 : .2);
  if (complete) { ctx.fillStyle = '#ffe9bb'; ctx.font = '17px Georgia'; ctx.textAlign = 'center'; ctx.fillText('A saída', EXIT.x, EXIT.y - 50); }
  if (state.mode === 'suspense' && litBeacons(state) > 0) state.shades.forEach((shade, index) => {
    if (shade.cooldown > 0 || (index === 1 && litBeacons(state) < 4)) return;
    const d = distance(state.player, shade); if (d > 420) return;
    ctx.save(); ctx.translate(shade.x, shade.y); ctx.globalAlpha = clamp(1 - d / 600, .25, .8);
    glow(ctx, 0, 0, 66, '#020207');
    for (let i = 0; i < 7; i++) { ctx.fillStyle = '#03061028'; ctx.beginPath(); ctx.ellipse(Math.sin(t * 1.5 + i) * 8, i * 6, 24 - i * 2, 27, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#010509'; ctx.beginPath(); ctx.moveTo(-19, 29); ctx.bezierCurveTo(-8, 7, -12, -16, 0, -23); ctx.bezierCurveTo(12, -16, 8, 7, 19, 29); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d3d9d0'; ctx.shadowColor = '#b0c8cd'; ctx.shadowBlur = 8; ctx.fillRect(-6, -12, 3, 2); ctx.fillRect(3, -12, 3, 2); ctx.restore();
  });
  if (target && distance(state.player, target) > 15) { ctx.strokeStyle = '#f6dba360'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(target.x, target.y, 13 + Math.sin(t * 2) * 3, 0, Math.PI * 2); ctx.stroke(); }
  // Warm flashlight cone and a softly lit traveler.
  const { player, angle } = state;
  glow(ctx, player.x, player.y, 120, '#ffc99b', .26);
  ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(angle);
  const beam = ctx.createRadialGradient(14, 0, 0, 14, 0, 290); beam.addColorStop(0, '#ffe0ad38'); beam.addColorStop(.6, '#f6d3a51c'); beam.addColorStop(1, '#f6d3a500');
  ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(8, 0); ctx.arc(8, 0, 290, -.58, .58); ctx.closePath(); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(player.x, player.y);
  ctx.fillStyle = '#010813aa'; ctx.beginPath(); ctx.ellipse(2, 12, 16, 7, 0, 0, Math.PI * 2); ctx.fill();
  const body = ctx.createLinearGradient(-10, -8, 10, 17); body.addColorStop(0, '#79939a'); body.addColorStop(1, '#172a37');
  ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(-8, -4); ctx.lineTo(8, -4); ctx.lineTo(12, 17); ctx.lineTo(-12, 17); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#bfc4b6'; ctx.beginPath(); ctx.arc(0, -7, 5.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#dce2d3'; ctx.beginPath(); ctx.arc(Math.cos(angle) * 14, Math.sin(angle) * 14, 3, 0, Math.PI * 2); ctx.fill(); glow(ctx, Math.cos(angle) * 14, Math.sin(angle) * 14, 26, '#ffe1a8', .9); ctx.restore();
  ctx.restore(); vignette(ctx, view, .74);
  if (state.panic > 15) { ctx.strokeStyle = `rgba(90,22,31,${state.panic / 160})`; ctx.lineWidth = 22; ctx.strokeRect(0, 0, view.width, view.height); }
  // Direction to the nearest light stays visible when the portrait camera crops it.
  const next = complete ? EXIT : [...state.beacons].filter((b) => b.charge < 1).sort((a, b) => distance(player, a) - distance(player, b))[0];
  if (next) {
    const px = next.x * scale + x, py = next.y * scale + y;
    if (px < 30 || px > view.width - 30 || py < 30 || py > view.height - 30) {
      const ax = clamp(px, 25, view.width - 25), ay = clamp(py, 125, view.height - 80);
      ctx.save(); ctx.translate(ax, ay); ctx.rotate(Math.atan2(py - ay, px - ax)); ctx.fillStyle = '#f6d9a9'; ctx.shadowColor = '#edca8e'; ctx.shadowBlur = 16; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-6, -6); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill(); ctx.restore();
    }
  }
  return camera;
}
