import type { PointerEvent as ReactPointerEvent } from 'react';

import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import MaterialSymbolsDragHandleRounded from '~icons/material-symbols/drag-handle-rounded';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

import { usePlayer } from './context/player-context';
import { removePlayer } from './player';
import MiniPlayer from './player-overlay/buttons/mini-player';
import Mute from './player-overlay/buttons/mute';
import Play from './player-overlay/buttons/play';
import Time from './player-overlay/sliders/time';

interface Props {
  onDragStart: (event: ReactPointerEvent<HTMLButtonElement>) => void;
}

const PlayerMiniBar = ({ onDragStart }: Props) => {
  const { currentEpisode, team } = usePlayer();
  const { data: animeData } = useHikkaAnime();

  const title =
    animeData?.title_ua ||
    animeData?.title_en ||
    animeData?.title_ja ||
    animeData?.title_original;

  const subtitle = currentEpisode?.episode
    ? `Епізод ${currentEpisode.episode}${team?.title ? ` · ${team.title}` : ''}`
    : team?.title;

  return (
    <div className="relative flex w-full flex-col">
      <div className="flex w-full items-center gap-1 p-2">
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground/70 shrink-0 cursor-grab active:cursor-grabbing"
          onPointerDown={onDragStart}
        >
          <MaterialSymbolsDragHandleRounded />
        </Button>
        <Play />
        <div className="flex items-center gap-2">
          <Avatar className="size-7 shrink-0 rounded-md">
            {team?.logo && <AvatarImage src={team.logo} alt={team.title} />}
            <AvatarFallback className="text-[10px] font-medium">
              {team?.title?.[0] ?? '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <span
              className="line-clamp-1 cursor-pointer truncate text-sm leading-tight font-semibold text-balance hover:underline"
              onClick={() => {
                history.pushState({}, '', `/anime/${animeData?.slug}`);
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
            >
              {title}
            </span>
            <span className="text-muted-foreground truncate text-xs leading-tight tabular-nums">
              {subtitle}
            </span>
          </div>
        </div>
        <Mute />
        <MiniPlayer />
        <Button
          variant="ghost"
          size="icon-xs"
          className="shrink-0"
          onClick={removePlayer}
        >
          <MaterialSymbolsCloseRounded />
        </Button>
      </div>
      <div className="absolute bottom-0 h-auto w-full">
        <Time trackClassName="pt-0.5 pb-0" />
      </div>
    </div>
  );
};

export default PlayerMiniBar;
