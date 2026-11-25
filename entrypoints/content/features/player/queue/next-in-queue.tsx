import MaterialSymbolsSkipNextRounded from '~icons/material-symbols/skip-next-rounded';

import { MediaTooltip } from '@/components/media/controls';
import { Button } from '@/components/ui/button';
import { useHikkaContent } from '@/hooks/use-hikka';

import { playNext } from '../player-iframe-effects';
import { useWatchTogether } from '../watch-together/use-watch-together';
import { upNext, useNextEpisode } from './up-next';

/**
 * Skips to what plays next, in a watch together room for everyone (once
 * most vote for it, if the room votes): the queue's first episode, else the
 * anime's following one. Hidden when neither exists.
 */
const NextInQueue = () => {
  const next = useNextEpisode();
  const { data: anime } = useHikkaContent(
    'anime',
    next?.queued ? next.slug : undefined,
  );
  // Alone among those who vote, the user moves on at once.
  const voting = useWatchTogether(
    (state) => !!state.room?.voting && state.room.voters > 1,
  );

  if (!next) return null;

  const label = `${
    next.queued
      ? `Далі: ${hikkaTitle(anime) ?? next.slug}, епізод ${next.episode}`
      : `Наступний епізод: ${next.episode}`
  }${voting ? ' · голосування' : ''}`;

  return (
    <MediaTooltip label={label} shortcut="Shift+N">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => {
          upNext.cancel();
          void playNext();
        }}
      >
        <MaterialSymbolsSkipNextRounded className="size-5" />
      </Button>
    </MediaTooltip>
  );
};

export default NextInQueue;
