import { useEffectEvent, useLayoutEffect, useRef } from 'react';
import type { LazuliFeedback } from '../../application/ports';
import { lineTotal, type GameEvent, type PlacedEvent } from '../../domain';
import type { EffectsHandle } from '../components/EffectsLayer';
import { countLabel, formatNumber, placedAnnouncement, praiseFor } from '../copy';

interface GameEventDeps {
  readonly event: GameEvent | null;
  readonly cols: number;
  readonly feedback: LazuliFeedback;
  readonly effectsRef: { readonly current: EffectsHandle | null };
  readonly gridRef: { readonly current: HTMLElement | null };
  readonly frameRef: { readonly current: HTMLElement | null };
  readonly coinRef: { readonly current: HTMLElement | null };
  readonly announce: (message: string) => void;
}

/**
 * Turns domain events into sound, haptics, particles and screen-reader
 * announcements. Runs in a layout effect so the shattering gems appear in the
 * same frame the cleared cells leave the board.
 */
export const useGameEvents = ({
  event,
  cols,
  feedback,
  effectsRef,
  gridRef,
  frameRef,
  coinRef,
  announce,
}: GameEventDeps): void => {
  const handledSeq = useRef(event?.seq ?? 0);

  const celebrate = (placed: PlacedEvent) => {
    const grid = gridRef.current?.getBoundingClientRect();
    const effects = effectsRef.current;
    if (!grid || !effects) return;
    const cell = grid.width / cols;
    const coin = coinRef.current?.getBoundingClientRect();
    const lines = lineTotal(placed.lines);

    effects.burst({
      cell,
      cells: placed.cleared.map(({ position, gem }) => ({
        x: grid.left + position.col * cell,
        y: grid.top + position.row * cell,
        gem,
      })),
      target: coin ? { x: coin.left + coin.width / 2, y: coin.top + coin.height / 2 } : null,
      onCoinArrive: () => {
        feedback.cue('coin');
        coinRef.current?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], {
          duration: 180,
          easing: 'ease-out',
        });
      },
    });

    const centre = placed.cleared.reduce(
      (sum, { position }) => ({ x: sum.x + position.col + 0.5, y: sum.y + position.row + 0.5 }),
      { x: 0, y: 0 },
    );
    const count = Math.max(1, placed.cleared.length);
    effects.floatText({
      x: grid.left + (centre.x / count) * cell,
      y: grid.top + (centre.y / count) * cell,
      text: `+${formatNumber(placed.points)}`,
      tone: 'points',
      delay: 120,
    });
    effects.floatText({
      x: grid.left + grid.width / 2,
      y: grid.top + grid.height * 0.38,
      text: praiseFor(lines, placed.perfectClear),
      tone: 'praise',
    });
    if (placed.streak >= 2) {
      effects.floatText({
        x: grid.left + grid.width / 2,
        y: grid.top + grid.height * 0.38 + cell * 1.5,
        text: `Combo ×${placed.streak}`,
        tone: 'combo',
        delay: 160,
      });
    }
    if (lines >= 3 || placed.perfectClear) effects.shake(frameRef.current, Math.min(8, 2 + lines * 1.5));
  };

  const handle = useEffectEvent((next: GameEvent) => {
    switch (next.type) {
      case 'started':
        announce('Nova partida. Arraste as peças até o tabuleiro e complete linhas ou colunas.');
        break;
      case 'rerolled':
        feedback.cue('reroll');
        announce(`Peças trocadas por ${countLabel(next.cost, 'moeda', 'moedas')}.`);
        break;
      case 'placed': {
        const lines = lineTotal(next.lines);
        if (lines === 0) {
          feedback.cue('drop');
        } else {
          feedback.cue('drop');
          feedback.cue(next.perfectClear ? 'perfect' : 'clear', lines);
          if (next.streak >= 2) feedback.cue('streak', next.streak);
          celebrate(next);
        }
        if (next.gameOver) {
          window.setTimeout(() => {
            feedback.cue('gameOver');
          }, 650);
        }
        announce(placedAnnouncement(next));
        break;
      }
    }
  });

  useLayoutEffect(() => {
    if (!event || event.seq <= handledSeq.current) return;
    handledSeq.current = event.seq;
    handle(event);
  }, [event]);
};
