import { useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react';
import styles from './Dialog.module.css';

interface DialogProps {
  readonly open: boolean;
  readonly labelledBy: string;
  readonly describedBy?: string;
  readonly initialFocusRef?: RefObject<HTMLElement | null>;
  /** Escape key or other platform dismissals. */
  readonly onCancel: () => void;
  readonly children: ReactNode;
}

/** Native modal <dialog>: focus trapping, Escape and top-layer stacking for free. */
export function Dialog({ open, labelledBy, describedBy, initialFocusRef, onCancel, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      initialFocusRef?.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, initialFocusRef]);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      {open && <div className={styles.card}>{children}</div>}
    </dialog>
  );
}
