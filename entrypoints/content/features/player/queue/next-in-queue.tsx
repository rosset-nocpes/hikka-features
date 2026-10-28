import MaterialSymbolsSkipNextRounded from '~icons/material-symbols/skip-next-rounded';

import { Button } from '@/components/ui/button';
import { useHikkaContent } from '@/hooks/use-hikka';

import { followingEpisode, usePlayer } from '../context/player-context';
import { playNext } from '../player-iframe-effects';
import ToolbarTooltip from '../player-overlay/toolbar-tooltip';
import { useActiveQueue } from './use-active-queue';

/**
 * Skips to what plays next, in a watch together room for everyone: the
 * queue's first episode, else the anime's following one. Hidden when
 * neither exists.
 */
const NextInQueue = () => {
  const queued = useActiveQueue().items[0];
  const following = usePlayer(followingEpisode);
  const { data: anime } = useHikkaContent('anime', queued?.slug);

  if (!queued && !following) return null;

  const label = queued
    ? `Далі: ${hikkaTitle(anime) ?? queued.slug}, епізод ${queued.episode}`
    : `Наступний епізод: ${following!.episode}`;

  return (
    <ToolbarTooltip label={label}>
      <Button variant="ghost" size="icon-sm" onClick={() => void playNext()}>
        <MaterialSymbolsSkipNextRounded className="size-5" />
      </Button>
    </ToolbarTooltip>
  );
};

export default NextInQueue;
