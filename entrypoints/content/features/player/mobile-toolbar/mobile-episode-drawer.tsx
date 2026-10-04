import { Fragment, useState } from 'react';

import MissingDivider, { countMissing } from '@/components/missing-divider';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

import { getWatched, usePlayer } from '../context/player-context';

const MobileEpisodeDrawer = () => {
  const [open, setOpen] = useState(false);
  const { container, currentEpisode, setEpisode, episodeData } = usePlayer();
  const watched = getWatched();

  const handleSelectEpisode = (episode: API.EpisodeData) => {
    setEpisode(episode);
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger
        render={
          <Button
            size="md"
            variant="secondary"
          >{`Епізод #${currentEpisode?.episode}`}</Button>
        }
      />
      <DrawerContent
        className="flex max-h-[80%] flex-col"
        container={container}
      >
        <DrawerHeader>
          <DrawerTitle>Оберіть епізод</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-2 overflow-y-auto p-4 pt-0">
          {episodeData?.map((ep, index) => {
            const previous = episodeData[index - 1]?.episode;
            const missing = countMissing(ep.episode, previous);

            return (
              <Fragment key={ep.video_url}>
                {missing > 0 && (
                  <MissingDivider count={missing} noun="episode" />
                )}
                <Button
                  variant={
                    ep.video_url === currentEpisode?.video_url
                      ? 'default'
                      : 'outline'
                  }
                  onClick={() => handleSelectEpisode(ep)}
                  className={cn(
                    'w-full shrink-0 text-lg',
                    ep.episode <= watched && 'text-muted-foreground',
                  )}
                >
                  {`Епізод #${ep.episode}${previous === ep.episode ? ' (Дублікат)' : ''}`}
                </Button>
              </Fragment>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileEpisodeDrawer;
