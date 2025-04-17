import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Eye } from 'lucide-react';
import { FC } from 'react';
import { getWatched, usePlayerContext } from '../context/player-context';

interface Props {
  toggleWatchedState: (state: boolean) => void;
}

const EpisodeList: FC<Props> = ({ toggleWatchedState }) => {
  const { open } = useSidebar();
  const playerContext = usePlayerContext();

  const handleSelectEpisode = (value: API.EpisodeData) => {
    playerContext.setState((prev) => ({ ...prev, currentEpisode: value }));
    toggleWatchedState(false);
  };

  const currentEpisodeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    currentEpisodeRef.current?.scrollIntoView({ behavior: 'instant' });
  }, []);

  return (
    <SidebarGroup>
      <SidebarMenu>
        {playerContext.state.episodeData.map((ep) => (
          <SidebarMenuItem
            key={ep.episode}
            // ref={
            //   ep.episode == playerContext.state.currentEpisode.episode
            //     ? currentEpisodeRef
            //     : null
            // }
          >
            <SidebarMenuButton
              onClick={() => handleSelectEpisode(ep)}
              isActive={
                ep.episode == playerContext.state.currentEpisode.episode
              }
            >
              <div
                className={cn(
                  'size-4 shrink-0 text-center duration-300',
                  open ? '-ml-6 text-transparent' : 'ml-0',
                )}
              >
                <span className="block leading-4">{ep.episode}</span>
              </div>
              <div className="grid flex-1 truncate text-left leading-tight">
                <span>Епізод #{ep.episode}</span>
              </div>
              {ep.episode <= getWatched() && (
                <Eye
                  className={cn(
                    'ml-auto transition-transform duration-200',
                    // !open && 'hidden',
                  )}
                />
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};

export default EpisodeList;
