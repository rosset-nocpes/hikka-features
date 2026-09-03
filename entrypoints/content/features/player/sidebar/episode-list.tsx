import { type FC, useEffect, useRef } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

import { getWatched, usePlayer } from '../context/player-context';

interface Props {
  toggleWatchedState: (state: boolean) => void;
}

const dateFormatter = new Intl.DateTimeFormat('uk-UA', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const episodeTypeLabels = {
  filler: 'Філер',
  mixed: 'Канон / філер',
  recap: 'Рекап',
} as const;

const getEpisodeTitle = (episode: API.EpisodeData) =>
  episode.title?.ua?.trim() ||
  episode.title?.en?.trim() ||
  episode.title?.ja?.trim();

const getEpisodeType = (episode: API.EpisodeData) => {
  const type = episode.episode_type ?? episode.filler_status;
  if (!type || type === 'canon') return;

  return type;
};

const getEpisodeReleaseDate = (releasedAt?: number) =>
  releasedAt ? dateFormatter.format(new Date(releasedAt * 1000)) : undefined;

const EpisodeList: FC<Props> = ({ toggleWatchedState }) => {
  const { episodeData, currentEpisode, setEpisode } = usePlayer();

  const handleSelectEpisode = (value: API.EpisodeData) => {
    setEpisode(value);
    toggleWatchedState(false);
  };

  const currentEpisodeRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!currentEpisodeRef.current) return;

    currentEpisodeRef.current.scrollIntoView({
      behavior: 'instant',
      block: 'center',
    });
  }, [!!currentEpisodeRef.current]);

  return (
    <SidebarGroup>
      <SidebarMenu>
        {episodeData?.map((ep, index) => {
          const title = getEpisodeTitle(ep);
          const duplicate =
            index > 0 && episodeData[index - 1].episode === ep.episode;
          const episodeType = getEpisodeType(ep);
          const metadata = [
            duplicate ? 'Дублікат' : undefined,
            getEpisodeReleaseDate(ep.releasedAt),
          ]
            .filter(Boolean)
            .join(' · ');

          return (
            <SidebarMenuItem
              key={ep.video_url}
              ref={
                ep.video_url === currentEpisode?.video_url
                  ? currentEpisodeRef
                  : null
              }
            >
              <SidebarMenuButton
                className="h-12 py-1.5"
                onClick={() => handleSelectEpisode(ep)}
                isActive={ep.video_url === currentEpisode?.video_url}
              >
                <div className="grid min-w-0 flex-1 text-left leading-tight">
                  <span
                    className={cn(
                      'truncate duration-300',
                      ep.episode <= getWatched() && 'text-muted-foreground',
                    )}
                  >
                    {title ? `${ep.episode}. ${title}` : `Епізод ${ep.episode}`}
                  </span>
                  {(metadata || episodeType) && (
                    <span className="flex min-w-0 items-center gap-1.5">
                      {metadata && (
                        <span className="text-muted-foreground truncate text-xs font-normal">
                          {metadata}
                        </span>
                      )}
                      {episodeType && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            'h-4 rounded-sm px-1.5 py-0 text-[10px] leading-none font-semibold transition-none',
                            episodeType === 'recap'
                              ? 'bg-info/15 text-info'
                              : 'bg-warning/15 text-warning',
                          )}
                        >
                          {episodeTypeLabels[episodeType]}
                        </Badge>
                      )}
                    </span>
                  )}
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default EpisodeList;
