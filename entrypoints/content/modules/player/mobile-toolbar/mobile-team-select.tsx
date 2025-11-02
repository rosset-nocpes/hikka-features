import { motion } from 'motion/react';
import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import MaterialSymbolsStarRateOutlineRounded from '~icons/material-symbols/star-rate-outline-rounded';
import MaterialSymbolsStarRounded from '~icons/material-symbols/star-rounded';
import { usePlayer } from '../context/player-context';

const getEpisodeRanges = (episodes: { episode: number }[]) => {
  if (!episodes.length) return '';

  const episodeNumbers = [...new Set(episodes.map((e) => e.episode))].sort(
    (a, b) => a - b,
  );

  const ranges = [];
  let start = episodeNumbers[0];
  let end = episodeNumbers[0];

  for (let i = 1; i < episodeNumbers.length; i++) {
    if (episodeNumbers[i] === end + 1) {
      end = episodeNumbers[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = episodeNumbers[i];
      end = episodeNumbers[i];
    }
  }

  ranges.push(start === end ? `${start}` : `${start}-${end}`);

  return ranges.join(', ');
};

const MobileTeamSelect = () => {
  const {
    provider,
    favoriteTeam,
    setFavoriteTeam,
    removeFavoriteTeam,
    team,
    setTeam,
  } = usePlayer();
  const { data } = useWatchData();

  const orderedTeams = useMemo<API.TeamData[]>(() => {
    if (!data || !provider) return [];
    const teams = (data[provider] as ProviderTeamIFrame).getTeams();
    return teams.slice().sort((a: API.TeamData, b: API.TeamData) => {
      if (a.title === favoriteTeam) return -1;
      if (b.title === favoriteTeam) return 1;
      return 0;
    });
  }, [data, provider, favoriteTeam]);

  if (!data || !provider || !team) return;

  const handleSelectTeam = (value: API.TeamData) => {
    setTeam(value);
    // toggleWatchedState(false);
  };

  const handleFavorite = (
    e: React.MouseEvent<HTMLButtonElement>,
    team: API.TeamData,
  ) => {
    e.stopPropagation();

    if (favoriteTeam === team.title) {
      removeFavoriteTeam();
      return;
    }

    setFavoriteTeam(team.title);
  };

  return (
    <motion.div layout className="flex flex-col gap-2">
      {orderedTeams.map((t) => (
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
            onClick={() => handleSelectTeam(t)}
            className={cn(
              'group/item w-full p-1 font-normal hover:bg-secondary/20',
              t.title === team.title &&
                '!bg-secondary !text-secondary-foreground',
            )}
          >
            <Avatar className="rounded-sm">
              <AvatarImage src={t.logo} alt={t.title} />
              <AvatarFallback>{t.title[0]}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate font-semibold text-lg">{t.title}</span>
              {/*<span className="truncate text-xs">
                {getEpisodeRanges(
                  (data[provider] as ProviderTeamIFrame).teams[t.title]
                    .episodes,
                )}
              </span>*/}
            </div>
            <Button
              variant="ghost"
              size="icon-md"
              className="group relative"
              onClick={(e) => handleFavorite(e, t)}
            >
              <div
                className={cn(
                  'absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out will-change-[transform,opacity,filter]',
                  favoriteTeam === t.title
                    ? 'scale-100 opacity-100 blur-0'
                    : 'scale-[0.25] opacity-0 blur-sm',
                )}
              >
                <MaterialSymbolsStarRounded className="!size-7 text-yellow-300 transition-transform duration-300" />
              </div>
              <div
                className={cn(
                  'opacity transition-[transform,filter] duration-300 ease-in-out will-change-[transform,opacity,filter]',
                  favoriteTeam === t.title
                    ? 'scale-[0.25] opacity-0 blur-sm'
                    : 'scale-100 opacity-100 blur-0',
                )}
              >
                <MaterialSymbolsStarRateOutlineRounded className="!size-7 text-muted-foreground transition-transform duration-300" />
              </div>
            </Button>
            {/*<div className="flex w-full items-center justify-between gap-2  text-left text-sm">

            </div>*/}
          </Button>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default MobileTeamSelect;
