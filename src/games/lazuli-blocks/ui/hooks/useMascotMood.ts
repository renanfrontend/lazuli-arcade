import { useEffect, useState } from 'react';
import { fillRatio, lineTotal, type GameState } from '../../domain';
import type { MascotMood } from '../components/Mascot';

const CELEBRATION_MS = 1600;
const WORRY_FILL = 0.62;

/** Base mood follows the board; clears trigger a short celebration on top. */
export const useMascotMood = (state: GameState, busy: boolean): MascotMood => {
  const event = state.lastEvent;
  const celebration = event?.type === 'placed' && event.cleared.length > 0 ? event : null;
  const [settledSeq, setSettledSeq] = useState<number | null>(null);

  useEffect(() => {
    if (!celebration) return;
    const { seq } = celebration;
    const timer = window.setTimeout(() => {
      setSettledSeq(seq);
    }, CELEBRATION_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [celebration]);

  if (state.status === 'over') return 'sad';
  if (celebration && settledSeq !== celebration.seq) {
    const big = lineTotal(celebration.lines) >= 2 || celebration.streak >= 2 || celebration.perfectClear;
    return big ? 'excited' : 'happy';
  }
  if (busy) return 'focused';
  return fillRatio(state.board) >= WORRY_FILL ? 'worried' : 'chill';
};
