export interface GardenPoint { readonly x: number; readonly y: number }
export const BUDS: readonly GardenPoint[] = [{ x: .22, y: .59 }, { x: .50, y: .64 }, { x: .78, y: .59 }, { x: .27, y: .80 }, { x: .55, y: .84 }, { x: .78, y: .79 }];
export interface GardenState { readonly growth: readonly number[] }
export const createGarden = (): GardenState => ({ growth: BUDS.map(() => 0) });
export const flowersAwake = (state: GardenState): number => state.growth.filter((value) => value >= 1).length;
export function nurtureGarden(state: GardenState, pointer: GardenPoint | null, elapsed: number): GardenState {
  if (!pointer || !Number.isFinite(elapsed) || elapsed <= 0) return state;
  const dt = Math.min(elapsed, .1);
  const growth = state.growth.map((value, index) => {
    const bud = BUDS[index];
    return bud && Math.hypot(bud.x - pointer.x, bud.y - pointer.y) < .105 ? Math.min(1, value + dt * .85) : value;
  });
  return growth.every((value, index) => value === state.growth[index]) ? state : { growth };
}
export function awakenFlower(state: GardenState, index: number): GardenState {
  if (!Number.isInteger(index) || index < 0 || index >= BUDS.length || state.growth[index] === 1) return state;
  return { growth: state.growth.map((v, i) => i === index ? 1 : v) };
}
export function restoreGarden(raw: unknown): GardenState {
  if (typeof raw !== 'object' || raw === null || !('growth' in raw) || !Array.isArray(raw.growth) || raw.growth.length !== BUDS.length) return createGarden();
  return { growth: raw.growth.map((v: unknown) => typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0) };
}
