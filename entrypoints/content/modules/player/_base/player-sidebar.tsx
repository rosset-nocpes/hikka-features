import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FC } from 'react';
import MaterialSymbolsVisibilityRounded from '~icons/material-symbols/visibility-rounded';
import {
  getWatched,
  playersAvaliable,
  usePlayerContext,
} from '../context/player-context';

interface Props {
  container: HTMLElement;
  data: API.WatchData;
  toggleWatchedState: (state: boolean) => void;
}

const PlayerSidebar: FC<Props> = ({ container, data, toggleWatchedState }) => {
  const playerContext = usePlayerContext();

  const handleSelectEpisode = (value: API.EpisodeData) => {
    playerContext.setState((prev) => ({ ...prev, episode: value }));
    toggleWatchedState(false);
  };

  const handleSelectPlayer = (value: PlayerSource) => {
    const newTeamName = Object.keys(data[value])[0];
    const newEpisode =
      data[value][newTeamName].find(
        (episode: API.EpisodeData) => episode.episode === getWatched() + 1,
      ) || data[value][newTeamName][0];

    const newEpisodeData = data[value][newTeamName];

    playerContext.setState({
      provider: value,
      team: newTeamName,
      episodeData: newEpisodeData,
      currentEpisode: newEpisode,
    });
    toggleWatchedState(false);
  };

  const handleSelectTeam = (value: string) => {
    const newEpisodeData = data[playerContext.state.provider][value];

    const newEpisode =
      data[playerContext.state.provider][value].find(
        (episode: API.EpisodeData) => episode.episode === getWatched() + 1,
      ) || data[playerContext.state.provider][value][0];

    playerContext.setState((prev) => ({
      ...prev,
      team: value,
      episodeData: newEpisodeData,
      currentEpisode: newEpisode,
    }));
    toggleWatchedState(false);
  };

  const currentEpisodeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    currentEpisodeRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="flex min-h-0 w-80 flex-col gap-4 rounded-md bg-secondary/30 p-4">
      <Tabs
        value={playerContext.state.provider}
        onValueChange={(value) => handleSelectPlayer(value as PlayerSource)}
      >
        <TabsList className="w-full">
          {playersAvaliable(data).map((elem: PlayerSource) => (
            <TabsTrigger key={elem} value={elem} className="flex-1">
              {elem.toUpperCase()}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Select value={playerContext.state.team} onValueChange={handleSelectTeam}>
        <SelectTrigger className="text-left">
          <SelectValue placeholder="Team name">
            {playerContext.state.team}
          </SelectValue>
        </SelectTrigger>
        <SelectContent container={container}>
          {Object.keys(data[playerContext.state.provider]).map((elem) => (
            <SelectItem key={elem} value={elem}>
              <div className="flex items-center gap-2">
                {STUDIO_LOGOS[
                  STUDIO_CORRECTED_NAMES[elem]
                    ? STUDIO_CORRECTED_NAMES[elem]
                        .replaceAll(' ', '')
                        .toLowerCase()
                    : elem.replaceAll(' ', '').toLowerCase()
                ] && (
                  <img
                    className="size-5"
                    style={{ borderRadius: '3px' }}
                    src={
                      STUDIO_LOGOS[
                        STUDIO_CORRECTED_NAMES[elem]
                          ? STUDIO_CORRECTED_NAMES[elem]
                              .replaceAll(' ', '')
                              .toLowerCase()
                          : elem.replaceAll(' ', '').toLowerCase()
                      ]
                    }
                  />
                )}
                {STUDIO_CORRECTED_NAMES[elem] || elem}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {data['type'] !== 'movie' && (
        <ScrollArea className="flex-1 rounded-md border bg-background p-2">
          {playerContext.state.episodeData.map((ep) => (
            <Button
              key={ep.episode}
              variant="ghost"
              ref={
                ep.episode == playerContext.state.currentEpisode.episode
                  ? currentEpisodeRef
                  : null
              }
              className={cn(
                'w-full justify-start border',
                ep.episode == playerContext.state.currentEpisode.episode
                  ? 'border-secondary'
                  : 'border-transparent',
              )}
              onClick={() => handleSelectEpisode(ep)}
            >
              <div className="flex w-full items-center justify-between">
                <span>Епізод #{ep.episode}</span>
                {ep.episode <= getWatched() && (
                  <MaterialSymbolsVisibilityRounded className="size-5 text-gray-500" />
                )}
              </div>
            </Button>
          ))}
        </ScrollArea>
      )}
    </div>
  );
};

export default PlayerSidebar;
