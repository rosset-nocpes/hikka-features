import { type FC, useState } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { SidebarMenu, SidebarSeparator } from '@/components/ui/sidebar';

import PanelTabs, { PanelContent, type PanelTab } from '../queue/panel-tabs';
import { AutoplaySwitch } from '../queue/queue-list';
import TeamSelect from '../sidebar/team-select';
import { useNowPlaying } from '../use-now-playing';

interface Props {
  className?: string;
}

/**
 * The player's sidebar for phones, under the video or in a drawer: what's
 * playing, its team, then the episodes, or the queue instead.
 */
const PlayerMobilePanel: FC<Props> = ({ className }) => {
  const { title, subtitle } = useNowPlaying();
  const [tab, setTab] = useState<PanelTab>('episodes');

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <div className="flex flex-col gap-2 p-2">
        <div className="grid min-w-0 px-2 pt-1 leading-tight">
          <span className="truncate text-sm font-medium">
            {title ?? 'Програвач'}
          </span>
          <span className="text-muted-foreground truncate text-xs tabular-nums">
            {subtitle}
          </span>
        </div>
        <PanelTabs value={tab} onChange={setTab} />
        {tab === 'episodes' ? (
          <SidebarMenu>
            <TeamSelect />
          </SidebarMenu>
        ) : (
          <SidebarMenu>
            <AutoplaySwitch />
          </SidebarMenu>
        )}
      </div>
      <SidebarSeparator className="mx-0" />
      <ScrollArea
        // Contained, so pulling past the top never refreshes the page.
        className="min-h-0 flex-1 *:data-[slot=scroll-area-viewport]:overscroll-contain"
        scrollFade
      >
        <div className="pb-[env(safe-area-inset-bottom)]">
          <PanelContent tab={tab} />
        </div>
      </ScrollArea>
    </div>
  );
};

export default PlayerMobilePanel;
