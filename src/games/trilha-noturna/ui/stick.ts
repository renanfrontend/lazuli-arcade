/** Analog movement vector: x is strafe (right positive), y is forward (up positive). */
export interface StickVector { readonly x: number; readonly y: number }

const DEAD_ZONE = 0.14;

/** Maps a pointer offset (screen space, y down) to a unit-disc vector; motion eases in after the dead zone. */
export function stickVector(dx: number, dy: number, radius: number): StickVector {
  const reach = Math.hypot(dx, dy);
  if (!Number.isFinite(reach) || radius <= 0) return { x: 0, y: 0 };
  const length = reach / radius;
  if (length < DEAD_ZONE) return { x: 0, y: 0 };
  const scaled = Math.min(1, (length - DEAD_ZONE) / (1 - DEAD_ZONE));
  return { x: (dx / reach) * scaled, y: (-dy / reach) * scaled };
}
