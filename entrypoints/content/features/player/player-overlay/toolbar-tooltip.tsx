import type { FC, ReactElement } from 'react';

import { Kbd } from '@/components/ui/kbd';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { usePlayer } from '../context/player-context';

interface Props {
  label: string;
  /** The key that does the same, as `aria-keyshortcuts` names it. */
  shortcut?: string;
  children: ReactElement;
  disabled?: boolean;
}

const ToolbarTooltip: FC<Props> = ({ label, shortcut, children, disabled }) => {
  const { container, overlay } = usePlayer();
  const uiShown = useIFramePlayer((state) => state.uiShown);

  return (
    <Tooltip
      disabled={disabled || !uiShown}
      onOpenChange={(open, details) => {
        if (open && details.reason === 'trigger-focus') details.cancel();
      }}
    >
      <TooltipTrigger
        aria-label={label}
        aria-keyshortcuts={shortcut}
        render={children}
      />
      <TooltipContent
        side="top"
        sideOffset={32}
        collisionBoundary={overlay ?? undefined}
        collisionPadding={8}
        container={container}
      >
        {label}
        {shortcut && (
          <Kbd className="shrink-0 whitespace-nowrap">
            {shortcut.replace('+', ' + ')}
          </Kbd>
        )}
      </TooltipContent>
    </Tooltip>
  );
};

export default ToolbarTooltip;
