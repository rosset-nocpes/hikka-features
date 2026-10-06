import type { PointerEvent as ReactPointerEvent } from 'react';

import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import MaterialSymbolsDragIndicator from '~icons/material-symbols/drag-indicator';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

import { usePlayer } from './context/player-context';
import { removePlayer } from './player';
import MiniPlayer from './player-overlay/buttons/mini-player';
import Mute from './player-overlay/buttons/mute';
import Play from './player-overlay/buttons/play';
import Time from './player-overlay/sliders/time';
import { getTeamName } from './teams';

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

  const teamName = team && getTeamName(team);
  const subtitle = currentEpisode?.episode
    ? `Епізод ${currentEpisode.episode}${teamName ? ` · ${teamName}` : ''}`
    : teamName;

  return (
    <div className="relative flex w-full flex-col">
      <div className="flex w-full items-center gap-2 p-2">
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Перемістити"
            className="text-muted-foreground cursor-grab touch-none active:cursor-grabbing"
            onPointerDown={onDragStart}
          >
            <MaterialSymbolsDragIndicator className="size-5" />
          </Button>
          <Play />
        </div>
        <Avatar className="size-8 shrink-0 rounded-md after:rounded-md">
          {team?.logo && <AvatarImage src={team.logo} alt="" />}
          <AvatarFallback className="rounded-md text-xs font-medium">
            {teamName?.[0] ?? '?'}
          </AvatarFallback>
        </Avatar>
        <div className="grid min-w-0 flex-1 leading-tight">
          <button
            type="button"
            className="truncate text-left text-sm font-medium hover:underline"
            onClick={() => {
              history.pushState({}, '', `/anime/${animeData?.slug}`);
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
          >
            {title}
          </button>
          <span className="text-muted-foreground truncate text-xs tabular-nums">
            {subtitle}
          </span>
        </div>
        <div className="flex shrink-0 gap-1">
          <Mute />
          <MiniPlayer />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Закрити програвач"
            onClick={removePlayer}
          >
            <MaterialSymbolsCloseRounded />
          </Button>
        </div>
      </div>
      <div className="absolute bottom-0 h-auto w-full">
        <Time trackClassName="pt-0.5 pb-0" />
      </div>
    </div>
  );
};

export default PlayerMiniBar;
