import MaterialSymbolsSkipNextRounded from '~icons/material-symbols/skip-next-rounded';

import { Button } from '@/components/ui/button';
import { useHikkaContent } from '@/hooks/use-hikka';

import { playNext } from '../player-iframe-effects';
import ToolbarTooltip from '../player-overlay/toolbar-tooltip';
import { useActiveQueue } from './use-active-queue';

/**
 * Skips to the queue's next episode, in a watch together room for everyone;
 * hidden while the queue is empty.
 */
const NextInQueue = () => {
  const next = useActiveQueue().items[0];
  const { data: anime } = useHikkaContent('anime', next?.slug);

  if (!next) return null;

  const title = hikkaTitle(anime) ?? next.slug;

  return (
    <ToolbarTooltip label={`Далі: ${title}, епізод ${next.episode}`}>
      <Button variant="ghost" size="icon-sm" onClick={() => void playNext()}>
        <MaterialSymbolsSkipNextRounded className="size-5" />
      </Button>
    </ToolbarTooltip>
  );
};

export default NextInQueue;
