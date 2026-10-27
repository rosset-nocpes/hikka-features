import { ScrollArea } from '@base-ui/react/scroll-area';
import { Tabs } from '@base-ui/react/tabs';
import { motion } from 'motion/react';
import { type FC, useLayoutEffect, useRef, useState } from 'react';
import MaterialSymbolsPlaylistPlayRounded from '~icons/material-symbols/playlist-play-rounded';
import MaterialSymbolsViewListRounded from '~icons/material-symbols/view-list-rounded';

import { slide, transition } from '../player-overlay/menu-pages';
import EpisodeList from '../sidebar/episode-list';
import QueueList from './queue-list';
import { useQueue } from './use-queue';

export type PanelTab = 'episodes' | 'queue';

const TAB =
  'text-muted-foreground hover:text-foreground data-active:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring relative z-10 flex h-8 items-center gap-1.5 rounded-md px-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0';

interface Props {
  value: PanelTab;
  onChange: (tab: PanelTab) => void;
  className?: string;
}

/**
 * Switches the player's panel between the anime's episodes and the queue,
 * like the sidebar's own rows: ghost buttons, the chosen one highlighted.
 */
const PanelTabs: FC<Props> = ({ value, onChange, className }) => {
  const count = useQueue((state) => state.items.length);

  return (
    <Tabs.Root value={value} onValueChange={onChange} className={className}>
      <Tabs.List className="relative flex items-center gap-1">
        <Tabs.Tab value="episodes" className={TAB}>
          <MaterialSymbolsViewListRounded />
          Епізоди
        </Tabs.Tab>
        <Tabs.Tab value="queue" className={TAB}>
          <MaterialSymbolsPlaylistPlayRounded />
          Черга
          {count > 0 && (
            <span className="text-muted-foreground text-xs tabular-nums">
              {count}
            </span>
          )}
        </Tabs.Tab>
        <Tabs.Indicator className="bg-sidebar-accent absolute top-(--active-tab-top) left-(--active-tab-left) h-(--active-tab-height) w-(--active-tab-width) rounded-md transition-[left,width] duration-200 ease-out" />
      </Tabs.List>
    </Tabs.Root>
  );
};

/**
 * The tab's list, slid in from its tab's side like the player's menu pages.
 * Goes inside a scroll area, which it tells when the list's height changes.
 */
export const PanelContent: FC<{ tab: PanelTab }> = ({ tab }) => {
  const ref = useRef<HTMLDivElement>(null);
  // The list the panel opens with appears in place; later ones slide in.
  const [shown, setShown] = useState(tab);
  const [switched, setSwitched] = useState(false);
  if (tab !== shown) {
    setShown(tab);
    setSwitched(true);
  }

  // Each list starts at its top; the episodes then scroll to the current one.
  useLayoutEffect(() => {
    const viewport = ref.current?.closest('[data-slot=scroll-area-viewport]');
    if (viewport) viewport.scrollTop = 0;
  }, [tab]);

  return (
    <ScrollArea.Content
      ref={ref}
      // Not the default fit-content, which would stop titles truncating.
      style={{ minWidth: 0 }}
      className="overflow-x-clip"
    >
      <motion.div
        key={tab}
        custom={tab === 'queue' ? 1 : -1}
        variants={slide}
        initial={switched ? 'enter' : false}
        animate="center"
        transition={transition}
      >
        {tab === 'episodes' ? <EpisodeList /> : <QueueList />}
      </motion.div>
    </ScrollArea.Content>
  );
};

export default PanelTabs;
