import { type FC, type ReactNode, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

/** How long it waits for the second click, and says it's done. */
const CONFIRM_MS = 3_000;
const DONE_MS = 1_500;

interface Props {
  children: ReactNode;
  /** What it does, in full, for screen readers. */
  label: string;
  /** What it says while it waits for the second click. */
  confirmLabel?: string;
  /** What it says for a moment once done. */
  doneLabel?: string;
  onConfirm: () => void;
}

/** A button that does something hard to undo on its second click. */
const ConfirmButton: FC<Props> = ({
  children,
  label,
  confirmLabel = 'Точно?',
  doneLabel = 'Готово',
  onConfirm,
}) => {
  const [state, setState] = useState<'idle' | 'confirming' | 'done'>('idle');

  useEffect(() => {
    if (state === 'idle') return;
    const timeout = setTimeout(
      () => setState('idle'),
      state === 'done' ? DONE_MS : CONFIRM_MS,
    );
    return () => clearTimeout(timeout);
  }, [state]);

  const text = {
    idle: children,
    confirming: confirmLabel,
    done: doneLabel,
  }[state];

  return (
    <>
      <Button
        variant={state === 'confirming' ? 'destructive' : 'ghost'}
        size="sm"
        aria-label={state === 'idle' ? label : `${label}: ${confirmLabel}`}
        className={cn(
          'min-w-24 shrink-0',
          state !== 'confirming' && 'text-muted-foreground',
        )}
        onBlur={() =>
          setState((current) => (current === 'confirming' ? 'idle' : current))
        }
        onClick={() => {
          if (state !== 'confirming') return setState('confirming');
          setState('done');
          onConfirm();
        }}
      >
        {text}
      </Button>
      <span role="status" className="sr-only">
        {state === 'done' ? doneLabel : ''}
      </span>
    </>
  );
};

export default ConfirmButton;
