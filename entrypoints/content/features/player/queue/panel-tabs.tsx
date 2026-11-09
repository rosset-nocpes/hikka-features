import { ScrollArea } from '@base-ui/react/scroll-area';
import { Tabs } from '@base-ui/react/tabs';
import { motion } from 'motion/react';
import { type FC, useLayoutEffect, useRef, useState } from 'react';
import MaterialSymbolsPlaylistPlayRounded from '~icons/material-symbols/playlist-play-rounded';
import MaterialSymbolsViewListRounded from '~icons/material-symbols/view-list-rounded';

import EpisodeList from '../sidebar/episode-list';
import QueueList from './queue-list';
import { useActiveQueue } from './use-active-queue';

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
  const count = useActiveQueue().items.length;
  // The count bumps as episodes are added, wherever from.
  const [seen, setSeen] = useState(count);
  const [grew, setGrew] = useState(false);
  if (count !== seen) {
    setSeen(count);
    setGrew(count > seen);
  }

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
            <motion.span
              key={count}
              initial={grew ? { scale: 1.4 } : false}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.3, bounce: 0.4 }}
              className="text-muted-foreground text-xs tabular-nums"
            >
              {count}
            </motion.span>
          )}
        </Tabs.Tab>
        <Tabs.Indicator className="bg-sidebar-accent absolute top-(--active-tab-top) left-(--active-tab-left) h-(--active-tab-height) w-(--active-tab-width) rounded-md transition-[left,width] duration-150 ease-out motion-reduce:transition-none" />
      </Tabs.List>
    </Tabs.Root>
  );
};

/** A tab switch is frequent, so its list only fades in. */
const fade = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
};

/**
 * The tab's list. Goes inside a scroll area, which it tells when the list's
 * height changes. `nowPlaying` heads the queue with the playing episode, for
 * panels that don't name it already.
 */
export const PanelContent: FC<{ tab: PanelTab; nowPlaying?: boolean }> = ({
  tab,
  nowPlaying,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  // The list the panel opens with appears in place; later ones fade in.
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
        variants={fade}
        initial={switched ? 'enter' : false}
        animate="center"
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        {tab === 'episodes' ? (
          <EpisodeList />
        ) : (
          <QueueList nowPlaying={nowPlaying} />
        )}
      </motion.div>
    </ScrollArea.Content>
  );
};

export default PanelTabs;
