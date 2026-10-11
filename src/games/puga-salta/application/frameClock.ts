const STEP_MS = 1000 / 60;
const MAX_ELAPSED_MS = 100;

/** Run the original 60 Hz physics at the same speed on every display. */
export const advanceFrame = (remainder: number, elapsed: number): { steps: number; remainder: number } => {
  const accumulated = remainder + Math.max(0, Math.min(MAX_ELAPSED_MS, elapsed));
  const steps = Math.floor((accumulated + 1e-8) / STEP_MS);
  return { steps, remainder: Math.max(0, accumulated - steps * STEP_MS) };
};
