import MaterialSymbolsSkipNextRounded from '~icons/material-symbols/skip-next-rounded';

import { Button } from '@/components/ui/button';
import { useHikkaContent } from '@/hooks/use-hikka';

import { playNext } from '../player-iframe-effects';
import ToolbarTooltip from '../player-overlay/toolbar-tooltip';
import { upNext, useNextEpisode } from './up-next';

/**
 * Skips to what plays next, in a watch together room for everyone: the
 * queue's first episode, else the anime's following one. Hidden when
 * neither exists.
 */
const NextInQueue = () => {
  const next = useNextEpisode();
  const { data: anime } = useHikkaContent(
    'anime',
    next?.queued ? next.slug : undefined,
  );

  if (!next) return null;

  const label = next.queued
    ? `Далі: ${hikkaTitle(anime) ?? next.slug}, епізод ${next.episode}`
    : `Наступний епізод: ${next.episode}`;

  return (
    <ToolbarTooltip label={label} shortcut="Shift+N">
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
    </ToolbarTooltip>
  );
};

export default NextInQueue;
