import { motion } from 'motion/react';
import { Fragment, useMemo } from 'react';
import MaterialSymbolsStarRateOutlineRounded from '~icons/material-symbols/star-rate-outline-rounded';
import MaterialSymbolsStarRounded from '~icons/material-symbols/star-rounded';

import SwapIcon from '@/components/swap-icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

import { isFavoriteTeam, usePlayer } from '../context/player-context';
import { getTeamName, groupTeams } from '../teams';

const MobileTeamSelect = () => {
  const {
    provider,
    favoriteTeam,
    toggleFavoriteTeam,
    team,
    setTeam,
    watchData: data,
  } = usePlayer();

  const teamGroups = useMemo(() => {
    if (!data || !provider) return [];
    if (!(data[provider] instanceof ProviderTeamIFrame)) return [];

    return groupTeams(data[provider].getTeams(), favoriteTeam?.team);
  }, [data, provider, favoriteTeam]);

  if (!data || !provider || !team) return;

  return (
    <motion.div layout className="flex flex-col gap-2 overflow-y-auto">
      {teamGroups.map((group) => (
        <Fragment key={group.type}>
          <motion.span layout className="px-2 py-1.5 text-sm font-semibold">
            {group.label}
          </motion.span>
          {group.teams.map((t) => (
            <motion.div
              key={t.title}
              layoutId={t.title}
              layout
              transition={{
                type: 'spring',
                stiffness: 600,
                damping: 40,
              }}
            >
              <Button
                variant="outline"
                onClick={() => setTeam(t)}
                className={cn(
                  'group/item hover:bg-secondary/20 w-full p-1 font-normal',
                  t.title === team.title &&
                    'bg-secondary! text-secondary-foreground!',
                )}
              >
                <Avatar className="rounded-sm">
                  <AvatarImage src={t.logo} alt={getTeamName(t)} />
                  <AvatarFallback>{getTeamName(t)[0]}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-lg font-semibold">
                    {getTeamName(t)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-md"
                  className="group relative"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavoriteTeam(t);
                  }}
                >
                  <SwapIcon
                    active={isFavoriteTeam({ favoriteTeam, provider }, t)}
                    on={
                      <MaterialSymbolsStarRounded className="size-7! text-yellow-300" />
                    }
                    off={
                      <MaterialSymbolsStarRateOutlineRounded className="text-muted-foreground size-7!" />
                    }
                  />
                </Button>
              </Button>
            </motion.div>
          ))}
        </Fragment>
      ))}
    </motion.div>
  );
};

export default MobileTeamSelect;
