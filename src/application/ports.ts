/** Driven ports: the application talks to the outside world only through these. */

export interface KeyValueStore {
  /** Parsed JSON for the key, or undefined when missing or unreadable. */
  readonly read: (key: string) => unknown;
  readonly write: (key: string, value: unknown) => void;
}

export type FeedbackCue =
  | 'pick'
  | 'drop'
  | 'invalid'
  | 'clear'
  | 'coin'
  | 'streak'
  | 'perfect'
  | 'reroll'
  | 'gameOver'
  | 'select';

export interface FeedbackPort {
  /** Sound (and haptics where available) for a game moment; `intensity` scales it, e.g. lines cleared. */
  readonly cue: (cue: FeedbackCue, intensity?: number) => void;
  readonly setEnabled: (enabled: boolean) => void;
  /** Browsers only start audio after a user gesture: call from one. */
  readonly unlock: () => void;
}

export type SeedSource = () => number;

export interface AppServices {
  readonly store: KeyValueStore;
  readonly feedback: FeedbackPort;
  readonly seedSource: SeedSource;
}
