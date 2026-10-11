import { useRef, type ReactNode } from 'react';
import { BackIcon, RestartIcon } from '../icons';
import { Dialog } from '../Dialog';
import dialog from '../Dialog.module.css';

interface MiniResultProps {
  readonly open: boolean;
  readonly id: string;
  readonly title: string;
  readonly text: string;
  readonly art?: ReactNode;
  readonly stats: readonly { readonly label: string; readonly value: string }[];
  readonly againLabel: string;
  readonly onAgain: () => void;
  readonly onExit: () => void;
}

/** End-of-game dialog shared by the lightweight games. */
export function MiniResult({ open, id, title, text, art, stats, againLabel, onAgain, onExit }: MiniResultProps) {
  const againRef = useRef<HTMLButtonElement>(null);
  return (
    <Dialog open={open} labelledBy={`${id}-title`} describedBy={`${id}-text`} initialFocusRef={againRef} onCancel={onExit}>
      {art}
      <h2 id={`${id}-title`} className={dialog.title}>
        {title}
      </h2>
      <p id={`${id}-text`} className={dialog.text}>
        {text}
      </p>
      <dl className={dialog.stats}>
        {stats.map((stat) => (
          <div key={stat.label}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>
      <div className={dialog.actions}>
        <button ref={againRef} type="button" className={dialog.primary} onClick={onAgain}>
          <RestartIcon />
          {againLabel}
        </button>
        <button type="button" className={dialog.secondary} onClick={onExit}>
          <BackIcon />
          Voltar ao arcade
        </button>
      </div>
    </Dialog>
  );
}
