import type { Ref } from 'react';
import type { DragHandlers } from '@shared/ui/drag/usePointerDrag';
import type { TraySlot } from '../../domain';
import { describeStack } from '../copy';
import { StackView } from './StackView';
import styles from './Trays.module.css';

interface PlayerTrayProps {
  readonly tray: readonly TraySlot[];
  readonly enabled: boolean;
  /** Waiting for the rival: the tray is drawn ghosted. */
  readonly waiting: boolean;
  readonly selectedSlot: number | null;
  readonly liftedSlot: number | null;
  readonly helpId: string;
  readonly bind: (slot: number) => DragHandlers;
}

export function PlayerTray({ tray, enabled, waiting, selectedSlot, liftedSlot, helpId, bind }: PlayerTrayProps) {
  return (
    <section className={styles.tray} aria-label="Suas pilhas" data-waiting={waiting}>
      {tray.map((stack, slot) => (
        <div key={slot} className={styles.slot}>
          {stack ? (
            <button
              key={stack.id}
              type="button"
              className={styles.stackButton}
              style={{ '--i': slot }}
              data-lifted={slot === liftedSlot}
              aria-pressed={slot === selectedSlot}
              aria-disabled={!enabled}
              aria-describedby={helpId}
              aria-label={`Pilha ${slot + 1}: ${describeStack(stack.tiles)}`}
              {...bind(slot)}
            >
              <StackView tiles={stack.tiles} />
            </button>
          ) : (
            <span className={styles.emptySlot} aria-hidden="true" />
          )}
        </div>
      ))}
    </section>
  );
}

/** The rival's tray at the top: ghosted while you play, solid while it takes its turn. */
export function RivalTray({ tray, active, slotRef }: { readonly tray: readonly TraySlot[]; readonly active: boolean; readonly slotRef: (slot: number) => Ref<HTMLDivElement> }) {
  return (
    <div className={styles.rival} data-active={active} aria-hidden="true">
      {tray.map((stack, slot) => (
        <div key={slot} ref={slotRef(slot)} className={styles.rivalSlot}>
          {stack && <StackView key={stack.id} tiles={stack.tiles} faded={!active} className={styles.rivalStack} />}
        </div>
      ))}
    </div>
  );
}
