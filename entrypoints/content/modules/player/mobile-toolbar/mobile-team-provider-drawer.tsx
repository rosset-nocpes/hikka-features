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
  const grouped_players: Record<ProviderLanguage, string[]> =
    ALL_LANGUAGES.reduce(
      (acc, lang) => {
        const players = avaliable_players
          .filter((p) => p.lang === lang)
          .map((p) => p.title);

        if (players.length) {
          acc[lang] = players;
        }

        return acc;
      },
      {} as Record<ProviderLanguage, string[]>,
    );

  const handleSelectPlayer = (value: string) => {
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
          <div className="flex flex-col gap-2 overflow-y-auto">
            {(
              Object.entries(grouped_players) as [ProviderLanguage, string[]][]
            ).map(([lang, players]) => (
              <div key={lang} className="flex flex-col gap-2">
                <span className="px-2 py-1.5 font-semibold text-sm">
                  {LANGUAGE_GROUP_NAMES[lang]}
                </span>
                <div className="flex flex-wrap gap-2">
                  {players.map((elem) => (
                    <Button
                      key={elem}
                      onClick={() => handleSelectPlayer(elem)}
                      variant={provider === elem ? 'default' : 'outline'}
                      className="flex-[1_0_calc(33.3%-0.5rem)] font-semibold text-lg"
                    >
                      {elem.toUpperCase()}
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
