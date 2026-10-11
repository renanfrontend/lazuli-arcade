/**
 * Driven ports shared by every game. Domain and application code reach the
 * outside world only through these; concrete adapters live in infrastructure
 * and are wired in the composition root (src/main.tsx).
 */

export interface KeyValueStore {
  /** Parsed JSON for the key, or undefined when missing or unreadable. */
  readonly read: (key: string) => unknown;
  readonly write: (key: string, value: unknown) => void;
}

/** Opens a store whose keys are isolated under `namespace` (one per game). */
export type StoreFactory = (namespace: string) => KeyValueStore;

export type SeedSource = () => number;

export interface ToneOptions {
  readonly freq: number;
  /** Glide target frequency. */
  readonly to?: number;
  /** Delay in seconds from now. */
  readonly at?: number;
  readonly duration: number;
  readonly type?: OscillatorType;
  readonly gain: number;
}

export interface NoiseOptions {
  readonly at?: number;
  readonly duration: number;
  readonly gain: number;
  readonly filter: BiquadFilterType;
  readonly freq: number;
  readonly to?: number;
}

/** Tiny synthesizer plus vibration. Every call is a no-op while sound is off. */
export interface AudioPort {
  readonly tone: (options: ToneOptions) => void;
  readonly noise: (options: NoiseOptions) => void;
  readonly vibrate: (pattern: number | readonly number[]) => void;
  /** Browsers only start audio after a user gesture: call from one. */
  readonly unlock: () => void;
  readonly setEnabled: (enabled: boolean) => void;
}

/** Game-specific sound and haptic cues, built on top of AudioPort. */
export interface FeedbackPort<TCue extends string> {
  /** `intensity` scales the cue, e.g. lines cleared or combo size. */
  readonly cue: (cue: TCue, intensity?: number) => void;
}
