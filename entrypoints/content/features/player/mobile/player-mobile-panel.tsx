import type { FC } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { SidebarMenu, SidebarSeparator } from '@/components/ui/sidebar';
import { useHikkaContent } from '@/hooks/use-hikka';

import { usePlayer } from '../context/player-context';
import EpisodeList from '../sidebar/episode-list';
import ProviderSelect from '../sidebar/provider-select';
import TeamSelect from '../sidebar/team-select';
import { getTeamName } from '../teams';

interface Props {
  className?: string;
}

/**
 * The player's sidebar for phones, under the video or in a drawer: what's
 * playing, its provider and team side by side, then the episodes.
 */
const PlayerMobilePanel: FC<Props> = ({ className }) => {
  const { slug, team, currentEpisode } = usePlayer();
  // The player's anime, which the page may no longer show.
  const { data: anime } = useHikkaContent('anime', slug);

  const teamName = team && getTeamName(team);
  const subtitle = currentEpisode?.episode
    ? `Епізод ${currentEpisode.episode}${teamName ? ` · ${teamName}` : ''}`
    : teamName;

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <div className="flex flex-col gap-2 p-2">
        <div className="grid min-w-0 px-2 pt-1 leading-tight">
          <span className="truncate text-sm font-medium">
            {hikkaTitle(anime) ?? 'Програвач'}
          </span>
          <span className="text-muted-foreground truncate text-xs tabular-nums">
            {subtitle}
          </span>
        </div>
        <SidebarMenu className="flex-row gap-1 *:min-w-0 *:flex-1">
          <ProviderSelect />
          <TeamSelect />
        </SidebarMenu>
      </div>
      <SidebarSeparator className="mx-0" />
      <ScrollArea className="min-h-0 flex-1" scrollFade>
        <div className="pb-[env(safe-area-inset-bottom)]">
          <EpisodeList />
        </div>
      </ScrollArea>
    </div>
  );
};

export default PlayerMobilePanel;
