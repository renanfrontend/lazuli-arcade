import { nextInt } from '@shared/domain/rng';

export const ANIMALS = ['🐶', '🐢', '🐰', '🐺', '🐷', '🐘', '🦊', '🐸'] as const;
export interface MemoryState {
  readonly cards: readonly number[]; readonly selected: readonly number[];
  readonly matched: readonly number[]; readonly moves: number; readonly won: boolean;
}

export const createMemory = (seed: number): MemoryState => {
  const cards = Array.from({ length: ANIMALS.length * 2 }, (_, index) => index % ANIMALS.length);
  let current = seed;
  for (let i = cards.length - 1; i > 0; i--) {
    const roll = nextInt(current, i + 1);
    current = roll.seed;
    const a = cards[i]; const b = cards[roll.value];
    if (a !== undefined && b !== undefined) { cards[i] = b; cards[roll.value] = a; }
  }
  return { cards, selected: [], matched: [], moves: 0, won: false };
};

export const flipMemory = (state: MemoryState, index: number): MemoryState => {
  const animal = state.cards[index];
  if (state.won || animal === undefined || state.selected.length === 2 || state.selected.includes(index) || state.matched.includes(animal)) return state;
  const first = state.selected[0];
  if (first === undefined) return { ...state, selected: [index] };
  const moves = state.moves + 1;
  if (state.cards[first] === animal) {
    const matched = [...state.matched, animal];
    return { ...state, selected: [], matched, moves, won: matched.length === ANIMALS.length };
  }
  return { ...state, selected: [first, index], moves };
};

export const hideMismatch = (state: MemoryState): MemoryState => state.selected.length === 2 ? { ...state, selected: [] } : state;
export const memoryScore = (moves: number): number => Math.max(100, 1200 - moves * 35);
