import { Dialog } from '@base-ui/react/dialog';
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

function DrawerN() {
  const { container } = usePlayer();

  return (
    <Dialog.Root>
      {/* 1. The Trigger */}
      <Dialog.Trigger className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
        Open Drawer
      </Dialog.Trigger>

      <Dialog.Portal container={container}>
        {/* 2. The Backdrop (Overlay) */}
        <Dialog.Backdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* 3. The Content (The "Drawer" itself) */}
        <Dialog.Viewport>
          <Dialog.Popup
            className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl p-6 flex flex-col gap-4 
                     data-open:animate-in data-closed:animate-out 
                     data-open:slide-in-from-right data-closed:slide-out-to-right 
                     duration-300 ease-in-out"
          >
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-xl font-semibold">
                Settings
              </Dialog.Title>
              <Dialog.Close className="p-1 hover:bg-gray-100 rounded-full transition">
                {/* <Cross2Icon className="w-5 h-5" /> */}
              </Dialog.Close>
            </div>

            <Dialog.Description className="text-gray-600">
              Adjust your preferences here. Changes are saved automatically.
            </Dialog.Description>

            <div className="flex-1 overflow-y-auto mt-4">
              {/* Your Drawer Content Goes Here */}
              <nav className="space-y-4">
                <div className="h-20 bg-gray-50 rounded-lg border border-dashed border-gray-300" />
                <div className="h-20 bg-gray-50 rounded-lg border border-dashed border-gray-300" />
                <div className="h-20 bg-gray-50 rounded-lg border border-dashed border-gray-300" />
              </nav>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const MobileEpisodeDrawer = () => {
  const [open, setOpen] = useState(false);
  const { container, currentEpisode, setEpisode, episodeData } = usePlayer();

  const handleSelectEpisode = (episode: API.EpisodeData) => {
    setEpisode(episode);
    setOpen(false);
  };

  return <DrawerN />;

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
              key={ep.video_url}
              variant={
                ep.video_url === currentEpisode?.video_url
                  ? 'default'
                  : 'outline'
              }
              onClick={() => handleSelectEpisode(ep)}
              className={cn(
                'w-full shrink-0 text-lg',
                index + 1 <= getWatched() && 'text-muted-foreground',
              )}
            >
              {`Епізод #${ep.episode}${index > 0 && episodeData[index - 1].episode === ep.episode ? ' (Дублікат)' : ''}`}
            </Button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileEpisodeDrawer;
