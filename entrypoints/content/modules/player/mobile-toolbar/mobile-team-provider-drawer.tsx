import { motion } from 'motion/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Separator } from '@/components/ui/separator';
import { getAvailablePlayers, usePlayer } from '../context/player-context';
import MobileTeamSelect from './mobile-team-select';

const MobileTeamProviderDrawer = () => {
  const { container, provider, setProvider, team } = usePlayer();
  const { data } = useWatchData();

  if (!data) return;

  const avaliable_players = getAvailablePlayers(data);

  const handleSelectPlayer = (value: PlayerSource) => {
    setProvider(value);
    // toggleWatchedState(false);
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Avatar className="size-10 rounded-md">
          <AvatarImage src={team?.logo} />
          <AvatarFallback>{team?.title?.slice(0, 2)}</AvatarFallback>
        </Avatar>
      </DrawerTrigger>
      <DrawerContent
        className="flex max-h-[80%] flex-col"
        container={container}
      >
        <DrawerHeader>
          <DrawerTitle>Оберіть програвач та команду</DrawerTitle>
        </DrawerHeader>
        <motion.div layout className="flex flex-col gap-4 p-4 pt-0">
          <div className="flex gap-2 overflow-y-auto">
            {avaliable_players
              // .filter((elem) => UkrainianPlayerSource.includes(elem))
              .map((elem: PlayerSource) => (
                <Button
                  key={elem}
                  onClick={() => handleSelectPlayer(elem)}
                  variant={provider === elem ? 'default' : 'outline'}
                  className="flex-1 font-semibold text-lg"
                >
                  {elem.toUpperCase()}
                </Button>
              ))}
          </div>
          <Separator />
          <MobileTeamSelect />
        </motion.div>
      </DrawerContent>
    </Drawer>
  );
};

export default MobileTeamProviderDrawer;
