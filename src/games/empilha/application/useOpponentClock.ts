import { useEffect, useEffectEvent } from 'react';
import type { BotProfile } from '../domain';

interface OpponentClockOptions {
  /** Playing, past the countdown, not paused and visible. */
  readonly active: boolean;
  readonly profile: BotProfile;
  /** Restarts the pause after each opponent move, and only then: the player's moves never reset it. */
  readonly turn: number;
  readonly onTurn: () => void;
}

/** Real-time opponent: one move after each think pause, frozen whenever the match is not live. */
export const useOpponentClock = ({ active, profile, turn, onTurn }: OpponentClockOptions): void => {
  const fire = useEffectEvent(onTurn);
  const { thinkMs, jitterMs } = profile;

  useEffect(() => {
    if (!active) return;
    const delay = Math.max(500, thinkMs + (Math.random() * 2 - 1) * jitterMs);
    const timer = window.setTimeout(() => {
      fire();
    }, delay);
    return () => {
      window.clearTimeout(timer);
    };
  }, [active, thinkMs, jitterMs, turn]);
};
