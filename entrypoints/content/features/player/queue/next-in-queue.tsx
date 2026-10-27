import MaterialSymbolsSkipNextRounded from '~icons/material-symbols/skip-next-rounded';

import { Button } from '@/components/ui/button';
import { useHikkaContent } from '@/hooks/use-hikka';

import { playNext } from '../player-iframe-effects';
import ToolbarTooltip from '../player-overlay/toolbar-tooltip';
import { useWatchTogether } from '../watch-together/use-watch-together';
import { useQueue } from './use-queue';

/** Skips to the queue's next episode; hidden while the queue is empty. */
const NextInQueue = () => {
  const next = useQueue((state) => state.items[0]);
  const inRoom = useWatchTogether((state) => !!state.room);
  const { data: anime } = useHikkaContent('anime', next?.slug);

  // A watch together room plays the anime's own next episode instead.
  if (!next || inRoom) return null;

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
