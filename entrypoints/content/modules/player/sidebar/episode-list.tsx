import type { FC } from 'react';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { getWatched, usePlayer } from '../context/player-context';

interface Props {
  toggleWatchedState: (state: boolean) => void;
}

const EpisodeList: FC<Props> = ({ toggleWatchedState }) => {
  const { open } = useSidebar();
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
        {episodeData?.map((ep, index) => (
          <SidebarMenuItem
            key={ep.video_url}
            ref={
              ep.video_url === currentEpisode?.video_url
                ? currentEpisodeRef
                : null
            }
          >
            <SidebarMenuButton
              onClick={() => handleSelectEpisode(ep)}
              isActive={ep.video_url === currentEpisode?.video_url}
            >
              <div
                className={cn(
                  'size-4 shrink-0 text-center duration-300',
                  open ? '-ml-6' : 'ml-0',
                )}
              >
                <span
                  className={cn(
                    'block leading-4 duration-300',
                    open && '!text-transparent',
                    ep.episode <= getWatched() && 'text-muted-foreground',
                  )}
                >
                  {ep.episode}
                </span>
              </div>
              <div className="grid flex-1 truncate text-left leading-tight">
                <span
                  className={cn(
                    'duration-300',
                    ep.episode <= getWatched() && 'text-muted-foreground',
                  )}
                >
                  {`Епізод #${ep.episode}${index > 0 && episodeData[index - 1].episode === ep.episode ? ' (Дублікат)' : ''}`}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default EpisodeList;
