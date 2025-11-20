import { useState } from 'react';
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

  const handleSelectEpisode = (episode: API.EpisodeData) => {
    setEpisode(episode);
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          size="md"
          variant="secondary"
        >{`Епізод #${currentEpisode?.episode}`}</Button>
      </DrawerTrigger>
      <DrawerContent
        className="flex max-h-[80%] flex-col"
        container={container}
      >
        <DrawerHeader>
          <DrawerTitle>Оберіть епізод</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-2 overflow-y-auto p-4 pt-0">
          {episodeData?.map((ep, index) => (
            <Button
              key={ep.episode}
              variant={
                ep.episode === currentEpisode?.episode ? 'default' : 'outline'
              }
              onClick={() => handleSelectEpisode(ep)}
              className={cn(
                'w-full shrink-0 text-lg',
                index + 1 <= getWatched() && 'text-muted-foreground',
              )}
            >
              Епізод #{ep.episode}
            </Button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileEpisodeDrawer;
