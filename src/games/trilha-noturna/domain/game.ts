export interface Point { readonly x: number; readonly y: number }
export type NightMode = 'explore' | 'suspense';
export interface Beacon extends Point { readonly charge: number }
export interface Shade extends Point { readonly cooldown: number }
export interface NightState {
  readonly player: Point; readonly angle: number; readonly beacons: readonly Beacon[]; readonly shades: readonly Shade[];
  readonly panic: number; readonly breath: number; readonly time: number; readonly mode: NightMode; readonly status: 'playing' | 'won' | 'lost';
}
export interface NightInput { readonly x: number; readonly y: number; readonly target: Point | null; readonly sprint: boolean }
export const WORLD = { width: 1536, height: 1024 };
export const EXIT: Point = { x: 1260, y: 200 };
export const BEACONS: readonly Point[] = [{ x: 670, y: 710 }, { x: 390, y: 580 }, { x: 460, y: 320 }, { x: 800, y: 260 }, { x: 1120, y: 430 }, { x: 1100, y: 710 }];
export const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);
export const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
export const litBeacons = (state: NightState): number => state.beacons.filter((beacon) => beacon.charge >= 1).length;
export const createNight = (mode: NightMode): NightState => ({
  player: { x: 780, y: 800 }, angle: -2.4, beacons: BEACONS.map((p) => ({ ...p, charge: 0 })),
  shades: [{ x: 300, y: 250, cooldown: 9 }, { x: 1240, y: 750, cooldown: 18 }],
  panic: 0, breath: 100, time: 0, mode, status: 'playing',
});
export function stepNight(state: NightState, input: NightInput, elapsed: number): NightState {
  if (state.status !== 'playing') return state;
  const dt = clamp(Number.isFinite(elapsed) ? elapsed : 0, 0, .1);
  if (dt === 0) return state;
  let dx = input.x, dy = input.y;
  if (dx === 0 && dy === 0 && input.target) { dx = input.target.x - state.player.x; dy = input.target.y - state.player.y; }
  const length = Math.hypot(dx, dy);
  const moving = length > .01;
  const sprinting = moving && input.sprint && state.breath > 2;
  const speed = sprinting ? 280 : 175;
  const travel = input.target && input.x === 0 && input.y === 0 ? Math.min(speed * dt, length) : speed * dt;
  const player = moving ? { x: clamp(state.player.x + dx / length * travel, 250, 1320), y: clamp(state.player.y + dy / length * travel, 190, 830) } : state.player;
  const angle = moving ? Math.atan2(dy, dx) : state.angle;
  const beacons = state.beacons.map((b) => distance(player, b) < 60 ? { ...b, charge: Math.min(1, b.charge + dt * 1.5) } : b);
  const lit = beacons.filter((b) => b.charge >= 1).length;
  const safe = beacons.some((b) => b.charge >= 1 && distance(player, b) < 125);
  const shades = state.shades.map((shade, index): Shade => {
    if (state.mode === 'explore' || lit < 1 || (index === 1 && lit < 4)) return { ...shade, cooldown: Math.max(0, shade.cooldown - dt) };
    if (shade.cooldown > 0) return { ...shade, cooldown: Math.max(0, shade.cooldown - dt) };
    const d = distance(player, shade);
    const direction = Math.atan2(shade.y - player.y, shade.x - player.x);
    const inBeam = Math.cos(direction - angle) > .70 && d < 285;
    const away = inBeam || safe;
    const velocity = (away ? -100 : 43 + lit * 3) * dt / Math.max(1, d);
    return { x: clamp(shade.x + (player.x - shade.x) * velocity, 200, 1370), y: clamp(shade.y + (player.y - shade.y) * velocity, 140, 870), cooldown: 0 };
  });
  const closeShade = state.mode === 'suspense' && lit > 0 && shades.some((s, i) => (i === 0 || lit >= 4) && s.cooldown <= 0 && distance(player, s) < 105);
  const panic = clamp(state.panic + dt * (safe ? -32 : closeShade ? 25 : -8), 0, 100);
  const won = lit === beacons.length && distance(player, EXIT) < 80;
  return { ...state, player, angle, beacons, shades, panic, breath: clamp(state.breath + dt * (sprinting ? -35 : 24), 0, 100), time: state.time + dt, status: won ? 'won' : panic >= 100 ? 'lost' : 'playing' };
}
