import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FC, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ContentScriptContext } from 'wxt/client';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import MaterialSymbolsWidthFullOutlineSharp from '~icons/material-symbols/width-full-outline-sharp';
import AshdiPlayer from './providers/ashdi';
import MoonPlayer from './providers/moon';
import WatchTogetherControls from './watch-together-controls';

export default function player(
  ctx: ContentScriptContext,
  data: API.WatchData,
  anime_data: any,
) {
  return createShadowRootUi(ctx, {
    name: 'player-ui',
    position: 'modal',
    zIndex: 100,
    async onMount(container) {
      const wrapper = document.createElement('div');
      container.append(wrapper);

      wrapper.className =
        'size-full backdrop-blur-sm bg-black/60 flex items-center justify-center p-8';

      container.className = 'h-full';
      container.classList.toggle('dark', await darkMode.getValue());

      const root = createRoot(wrapper);
      root.render(
        <>
          <div
            className="fixed z-0 size-full"
            onClick={() =>
              player(ctx, data!, anime_data)!.then((x) => x!.remove())
            }
          />

          <Player
            container={container}
            ctx={ctx}
            data={data}
            anime_data={anime_data}
          />
        </>,
      );

      return { root, wrapper };
    },
    onRemove: (elements) => {
      elements?.then((x) => {
        x?.root.unmount();
        x?.wrapper.remove();
      });
      document.body.removeChild(document.getElementsByTagName('player-ui')[0]);
      document.body.classList.toggle('h-full');
      document.body.classList.toggle('overflow-hidden');
    },
  });
}

interface Props {
  container: HTMLElement;
  ctx: ContentScriptContext;
  data: API.WatchData;
  anime_data: any;
}

export const Player: FC<Props> = ({ container, ctx, data, anime_data }) => {
  const getWatched = () =>
    parseInt(
      document.body.querySelector('div.rounded-lg.border:nth-child(2) h3')
        ?.firstChild?.nodeValue!,
    );

  const playersAvaliable: PlayerSource[] = Object.keys(data).filter(
    (e) => e !== 'type',
  ) as PlayerSource[];

  // Initialize with default values
  // TODO: move it to hooks
  const [playerState, setPlayerState] = useState<PlayerState>(() => {
    const defaultProvider = playersAvaliable[0];
    const defaultTeam = Object.keys(data[defaultProvider])[0];
    const defaultEpisode =
      data[defaultProvider][defaultTeam].find(
        (obj: any) => obj.episode == getWatched() + 1,
      ) || data[defaultProvider][defaultTeam][0];

    return {
      provider: defaultProvider,
      team: defaultTeam,
      episode: defaultEpisode,
    };
  });

  const [episodesData, setEpisodesData] = useState(
    data[playersAvaliable[0]][Object.keys(data[playersAvaliable[0]])[0]],
  );

  const [getNextEpState, setNextEpState] = useState(false);
  const [getWatchedState, toggleWatchedState] = useState(false);
  const [getTheatreState, toggleTheatreState] = useState(false);
  const [getPlayerState, togglePlayerState] = useState(true);
  const [getRichPresence, setRichPresence] = useState(false);
  const [getRichPresenceCheck, setRichPresenceCheck] = useState<boolean>();
  const [darkModeState, setDarkModeState] = useState(false);

  const [getUserData, setUserData] = useState<UserDataV2 | null>();

  let saved_desc_state = false;

  const handleSelectEpisode = (value: any) => {
    setPlayerState((prev) => ({ ...prev, episode: value }));
    setNextEpState(false);
    toggleWatchedState(false);
  };

  const handleSelectPlayer = (value: PlayerSource) => {
    const newTeamName = Object.keys(data[value])[0];
    const newEpisode =
      data[value][newTeamName].find(
        (obj: any) => obj.episode == getWatched() + 1,
      ) || data[value][newTeamName][0];

    setPlayerState({
      provider: value,
      team: newTeamName,
      episode: newEpisode,
    });
    setEpisodesData(data[value][newTeamName]);
    setNextEpState(false);
    toggleWatchedState(false);
  };

  const handleSelectTeam = (value: string) => {
    const newEpisode =
      data[playerState.provider][value].find(
        (obj: any) => obj.episode == getWatched() + 1,
      ) || data[playerState.provider][value][0];

    setPlayerState((prev) => ({
      ...prev,
      team: value,
      episode: newEpisode,
    }));
    setEpisodesData(data[playerState.provider][value]);
    setNextEpState(false);
    toggleWatchedState(false);
  };

  // Handle async initialization
  useEffect(() => {
    const initializeAsync = async () => {
      const defaultPlayerValue = await defaultPlayer.getValue();
      const richPresenceValue = await richPresence.getValue();
      const darkModeValue = await darkMode.getValue();
      const userDataValue = await userData.getValue();

      handleSelectPlayer(
        playersAvaliable.includes(defaultPlayerValue)
          ? defaultPlayerValue
          : defaultPlayerValue === 'moon'
            ? 'ashdi'
            : 'moon',
      );
      setRichPresence(richPresenceValue);
      setDarkModeState(darkModeValue);
      setUserData(userDataValue);
    };

    initializeAsync();

    richPresence.watch(setRichPresence);
  }, []);

  const currentEpisodeRef = useRef(null);

  useEffect(() => {
    // if (fields.length > 0) {
    (currentEpisodeRef!.current as any).scrollIntoView({ behavior: 'smooth' }); //Use scrollIntoView to automatically scroll to my ref
    // }
  }, []);

  return (
    <Card
      className={cn(
        'z-10 flex h-[776px] max-h-full w-[1280px] flex-col overflow-hidden',
        getTheatreState && 'h-full',
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Player
          <Button
            variant="ghost"
            size="icon-md"
            onClick={() =>
              player(ctx, data!, anime_data)!.then((x) => x!.remove())
            }
          >
            <MaterialSymbolsCloseRounded />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        <div className="flex size-full gap-4">
          <div className="min-w-0 flex-1 gap-2">
            <AspectRatio ratio={16 / 9}>
              {/* <div className="absolute h-[100%] w-[100%] bg-white blur-lg z-[-1] opacity-50" /> */}
              {playerState.provider === 'moon' ? (
                <MoonPlayer
                  playerState={playerState}
                  data={data}
                  getWatchedState={getWatchedState}
                  getNextEpState={getNextEpState}
                  setNextEpState={setNextEpState}
                  toggleWatchedState={toggleWatchedState}
                />
              ) : (
                <AshdiPlayer
                  container={container}
                  playerState={playerState}
                  data={data}
                  getWatchedState={getWatchedState}
                  getNextEpState={getNextEpState}
                  setNextEpState={setNextEpState}
                  toggleWatchedState={toggleWatchedState}
                  handleSelectEpisode={handleSelectEpisode}
                />
              )}
            </AspectRatio>
            <div className="flex items-center gap-2">
              {getUserData && (
                <WatchTogetherControls
                  container={container}
                  playerState={playerState}
                  setPlayerState={setPlayerState}
                  animeSlug={anime_data.slug}
                />
              )}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleTheatreState(!getTheatreState)}
                >
                  <MaterialSymbolsWidthFullOutlineSharp className="flex-1" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex min-h-0 w-80 flex-col gap-4 rounded-md bg-secondary/30 p-4">
            <Tabs
              value={playerState.provider}
              onValueChange={(value) =>
                handleSelectPlayer(value as PlayerSource)
              }
            >
              <TabsList className="w-full">
                {playersAvaliable.map((elem) => (
                  <TabsTrigger key={elem} value={elem} className="flex-1">
                    {elem.toUpperCase()}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Select value={playerState.team} onValueChange={handleSelectTeam}>
              <SelectTrigger className="text-left">
                <SelectValue placeholder="Team name">
                  {playerState.team}
                </SelectValue>
              </SelectTrigger>
              <SelectContent container={container}>
                {Object.keys(data[playerState.provider]).map((elem) => (
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
                {episodesData.map((ep) => (
                  <Button
                    key={ep.episode}
                    variant={
                      ep.episode == playerState.episode.episode
                        ? 'outline'
                        : 'ghost'
                    }
                    ref={
                      ep.episode == playerState.episode.episode
                        ? currentEpisodeRef
                        : null
                    }
                    className="w-full justify-start"
                    onClick={() => handleSelectEpisode(ep)}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span>Episode {ep.episode}: NULL</span>
                      <span className="text-gray-500 text-sm">0:00</span>
                    </div>
                  </Button>
                ))}
              </ScrollArea>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
