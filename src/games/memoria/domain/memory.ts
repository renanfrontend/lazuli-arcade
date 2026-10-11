import { CAST_IDS, type CastId } from '@shared/cast/cast';
import { nextInt, toSeed, type Seed } from '@shared/domain/rng';

export type CardFace = 'down' | 'up' | 'matched';

export interface Card {
  readonly cast: CastId;
  readonly face: CardFace;
}

/** Sixteen cards: two of each cast member. */
export interface MemoryGame {
  readonly cards: readonly Card[];
  readonly moves: number;
}

export interface MemoriaState {
  /** Fewest moves ever needed to win, or null before the first win. */
  readonly best: number | null;
  readonly game: MemoryGame;
}

export type MemoryAction =
  | { readonly type: 'flip'; readonly index: number }
  /** Resolves the two cards that are face up: a pair stays, a miss turns back. */
  | { readonly type: 'settle' }
  | { readonly type: 'newGame'; readonly seed: Seed };

export const PAIRS = CAST_IDS.length;

const shuffle = <T,>(items: readonly T[], seed: Seed): T[] => {
  const result = [...items];
  let current = toSeed(seed);
  for (let index = result.length - 1; index > 0; index -= 1) {
    const roll = nextInt(current, index + 1);
    current = roll.seed;
    const a = result[index];
    const b = result[roll.value];
    if (a !== undefined && b !== undefined) {
      result[index] = b;
      result[roll.value] = a;
    }
  }
  return result;
};

export const createGame = (seed: Seed): MemoryGame => ({
  cards: shuffle([...CAST_IDS, ...CAST_IDS], seed).map((cast): Card => ({ cast, face: 'down' })),
  moves: 0,
});

export const initialState = (seed: Seed, best: number | null = null): MemoriaState => ({ best, game: createGame(seed) });

const faceUp = (game: MemoryGame): number[] => game.cards.flatMap((card, index) => (card.face === 'up' ? [index] : []));

export const matchedPairs = (game: MemoryGame): number => game.cards.filter((card) => card.face === 'matched').length / 2;

export const isWon = (game: MemoryGame): boolean => matchedPairs(game) === PAIRS;

/** True while two cards wait to be resolved: the board ignores flips until then. */
export const needsSettle = (game: MemoryGame): boolean => faceUp(game).length === 2;

const withFaces = (game: MemoryGame, faces: ReadonlyMap<number, CardFace>, moves = game.moves): MemoryGame => ({
  cards: game.cards.map((card, index) => ({ ...card, face: faces.get(index) ?? card.face })),
  moves,
});

export const memoryReducer = (state: MemoriaState, action: MemoryAction): MemoriaState => {
  const { game } = state;
  switch (action.type) {
    case 'newGame':
      return { best: state.best, game: createGame(action.seed) };
    case 'flip': {
      const card = game.cards[action.index];
      if (card?.face !== 'down' || needsSettle(game) || isWon(game)) return state;
      const up = faceUp(game).length + 1;
      return { ...state, game: withFaces(game, new Map([[action.index, 'up']]), up === 2 ? game.moves + 1 : game.moves) };
    }
    case 'settle': {
      const [first, second] = faceUp(game);
      if (first === undefined || second === undefined) return state;
      const match = game.cards[first]?.cast === game.cards[second]?.cast;
      const next = withFaces(game, new Map<number, CardFace>([[first, match ? 'matched' : 'down'], [second, match ? 'matched' : 'down']]));
      const best = isWon(next) ? Math.min(state.best ?? Number.POSITIVE_INFINITY, next.moves) : state.best;
      return { best, game: next };
    }
  }
};
