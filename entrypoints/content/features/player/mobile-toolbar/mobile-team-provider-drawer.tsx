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

import { usePlayer } from '../context/player-context';
import { getTeamName, groupProviders } from '../teams';
import MobileTeamSelect from './mobile-team-select';

const MobileTeamProviderDrawer = () => {
  const {
    container,
    provider,
    setProvider,
    team,
    watchData: data,
  } = usePlayer();

  if (!data) return;

  return (
    <Drawer>
      <DrawerTrigger
        render={
          <Avatar className="size-10 rounded-md">
            <AvatarImage src={team?.logo} />
            <AvatarFallback>
              {team && getTeamName(team).slice(0, 2)}
            </AvatarFallback>
          </Avatar>
        }
      />
      <DrawerContent
        className="flex max-h-[80%] flex-col"
        container={container}
      >
        <DrawerHeader>
          <DrawerTitle>Оберіть програвач та команду</DrawerTitle>
        </DrawerHeader>
        <motion.div
          layout
          className="flex flex-col gap-4 overflow-y-auto p-4 pt-0"
        >
          <div className="flex flex-col gap-2">
            {groupProviders(data).map(({ lang, titles }) => (
              <div key={lang} className="flex flex-col gap-2">
                <span className="px-2 py-1.5 text-sm font-semibold">
                  {LANGUAGE_GROUP_NAMES[lang]}
                </span>
                <div className="flex flex-wrap gap-2">
                  {titles.map((title) => (
                    <Button
                      key={title}
                      onClick={() => setProvider(title)}
                      variant={provider === title ? 'default' : 'outline'}
                      className="flex-[1_0_calc(33.3%-0.5rem)] text-lg font-semibold"
                    >
                      {title.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
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
