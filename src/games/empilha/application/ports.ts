import type { FeedbackPort, KeyValueStore, SeedSource } from '@shared/application/ports';

export type { KeyValueStore, SeedSource } from '@shared/application/ports';

export type EmpilhaCue =
  | 'select'
  | 'pick'
  | 'drop'
  | 'invalid'
  | 'hop'
  | 'clear'
  | 'unlock'
  | 'tick'
  | 'go'
  | 'win'
  | 'lose'
  | 'rivalScore';

export type EmpilhaFeedback = FeedbackPort<EmpilhaCue>;

/** What the Empilha screen needs, built from the arcade services by the game's composition root. */
export interface EmpilhaServices {
  readonly store: KeyValueStore;
  readonly feedback: EmpilhaFeedback;
  readonly seedSource: SeedSource;
}
