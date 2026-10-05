import type { FC, ReactElement } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { usePlayer } from '../context/player-context';

interface Props {
  label: string;
  children: ReactElement;
  disabled?: boolean;
}

const ToolbarTooltip: FC<Props> = ({ label, children, disabled }) => {
  const { container, overlayRef } = usePlayer();
  const uiShown = useIFramePlayer((state) => state.uiShown);

  return (
    <Tooltip
      disabled={disabled || !uiShown}
      onOpenChange={(open, details) => {
        if (open && details.reason === 'trigger-focus') details.cancel();
      }}
    >
      <TooltipTrigger aria-label={label} render={children} />
      <TooltipContent
        side="top"
        sideOffset={32}
        collisionBoundary={overlayRef.current ?? undefined}
        collisionPadding={8}
        container={container}
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
};

export default ToolbarTooltip;
