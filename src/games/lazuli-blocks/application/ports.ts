import type { FeedbackPort, KeyValueStore, SeedSource } from '@shared/application/ports';

export type { KeyValueStore, SeedSource } from '@shared/application/ports';

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

export type LazuliFeedback = FeedbackPort<FeedbackCue>;

/** What the Lazuli screen needs, built from the arcade services by the game's composition root. */
export interface LazuliServices {
  readonly store: KeyValueStore;
  readonly feedback: LazuliFeedback;
  readonly seedSource: SeedSource;
}
