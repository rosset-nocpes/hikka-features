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
import { Toaster } from '@/components/ui/sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FC, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { toast } from 'sonner';
import { ContentScriptContext } from 'wxt/client';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import MaterialSymbolsFullscreen from '~icons/material-symbols/fullscreen';
import MaterialSymbolsVisibilityRounded from '~icons/material-symbols/visibility-rounded';
import MaterialSymbolsWidthFullOutlineSharp from '~icons/material-symbols/width-full-outline-sharp';
import {
  PlayerProvider,
  getWatched,
  playersAvaliable,
  usePlayerContext,
} from './context/player-context';
import ShareLinkButton from './toolbar/share-link-button';
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
        <PlayerProvider data={data!}>
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
          <Toaster position="top-center" />
        </PlayerProvider>,
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
  const playerContext = usePlayerContext();

  const [urlParams] = useState(() => {
    const path_params = new URLSearchParams(window.location.search);
    return {
      sharedPlayerProvider: path_params.get('playerProvider'),
      sharedPlayerTeam: path_params.get('playerTeam'),
      sharedPlayerEpisode: path_params.get('playerEpisode'),
      sharedPlayerTime: path_params.get('time'),
      sharedCheck: !!(
        path_params.get('playerProvider') &&
        path_params.get('playerTeam') &&
        path_params.get('playerEpisode')
      ),
    };
  });

  const playerIframe = container.querySelector(
    '#player-iframe',
  ) as HTMLIFrameElement;

  // Initialize with default values
  // TODO: move it to hooks

  const [episodesData, setEpisodesData] = useState(
    data[playerContext.playerState.provider][playerContext.playerState.team],
  );

  const [getNextEpState, setNextEpState] = useState(false);
  const [getWatchedState, toggleWatchedState] = useState(false);
  const [getTheatreState, toggleTheatreState] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTimecodeLink, toggleTimestampLink] = useState(false);
  const [timecodeLink, setTimecodeLink] = useState(0);
  const [getPlayerState, togglePlayerState] = useState(true);
  const [getRichPresence, setRichPresence] = useState(false);
  const [getRichPresenceCheck, setRichPresenceCheck] = useState<boolean>();
  const [darkModeState, setDarkModeState] = useState(false);

  const [getUserData, setUserData] = useState<UserDataV2 | null>();

  let saved_desc_state = false;

  const handleSelectEpisode = (value: API.EpisodeData) => {
    playerContext.setPlayerState((prev) => ({ ...prev, episode: value }));
    toggleWatchedState(false);
  };

  const handleSelectPlayer = (value: PlayerSource) => {
    const newTeamName = Object.keys(data[value])[0];
    const newEpisode =
      data[value][newTeamName].find(
        (obj: any) => obj.episode == getWatched() + 1,
      ) || data[value][newTeamName][0];

    playerContext.setPlayerState({
      provider: value,
      team: newTeamName,
      episode: newEpisode,
    });
    setEpisodesData(data[value][newTeamName]);
    toggleWatchedState(false);
  };

  const handleSelectTeam = (value: string) => {
    const newEpisode =
      data[playerContext.playerState.provider][value].find(
        (obj: any) => obj.episode === getWatched() + 1,
      ) || data[playerContext.playerState.provider][value][0];

    playerContext.setPlayerState((prev) => ({
      ...prev,
      team: value,
      episode: newEpisode,
    }));
    setEpisodesData(data[playerContext.playerState.provider][value]);
    toggleWatchedState(false);
  };

  const handleEnterFullscreen = () => {
    setIsFullscreen(true);
    document.documentElement.requestFullscreen();

    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        handleExitFullscreen();
      }
    });
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
    document.exitFullscreen();

    document.removeEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        handleExitFullscreen();
      }
    });
  };

  const [seekToSharedTime, toggleSeekToSharedTime] = useState(false);
  let duration = 0;
  const [time, setTime] = useState(0);

  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      if (event.data.event === 'time') {
        const message = event.data;
        duration = message.duration;
        setTime(message.time);

        if (time / duration > 0.88 && !getWatchedState) {
          if (getWatched() + 1 === playerContext.playerState.episode.episode) {
            (
              document.body.querySelector(
                'div.inline-flex:nth-child(2) button:nth-child(2)',
              ) as HTMLButtonElement
            )?.click();
            toggleWatchedState(true);
          }
        }
      } else if (
        event.data.event === 'end' &&
        !getNextEpState &&
        data[playerContext.playerState.provider][
          playerContext.playerState.team
        ].find(
          (obj: any) =>
            obj.episode === playerContext.playerState.episode.episode + 1,
        )
      ) {
        setNextEpState(true);
        handleSelectEpisode(
          data[playerContext.playerState.provider][
            playerContext.playerState.team
          ].find(
            (obj) =>
              obj.episode === playerContext.playerState.episode.episode + 1,
          )!,
        );
      } else if (event.data.event === 'init' && getNextEpState) {
        setNextEpState(false);
        playerIframe.contentWindow?.postMessage({ api: 'play' }, '*');

        toast(
          `Зараз ви переглядаєте ${playerContext.playerState.episode.episode} епізод в озвучці ${playerContext.playerState.team}`,
        );
      }

      if (event.data.event === 'init' && seekToSharedTime) {
        toggleSeekToSharedTime(false);
        playerIframe.contentWindow?.postMessage(
          { api: 'play', set: `[seek:${urlParams.sharedPlayerTime}]` },
          '*',
        );
      }
    };

    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, [
    getNextEpState,
    playerContext.playerState,
    data,
    getWatchedState,
    seekToSharedTime,
    urlParams.sharedPlayerTime,
  ]);

  // Handle async initialization
  useEffect(() => {
    const initializeAsync = async () => {
      const defaultPlayerValue = await defaultPlayer.getValue();
      const richPresenceValue = await richPresence.getValue();
      const darkModeValue = await darkMode.getValue();
      const userDataValue = await userData.getValue();

      if (!urlParams.sharedCheck) {
        handleSelectPlayer(
          playersAvaliable(data).includes(defaultPlayerValue)
            ? defaultPlayerValue
            : defaultPlayerValue === 'moon'
              ? 'ashdi'
              : 'moon',
        );
      }

      setRichPresence(richPresenceValue);
      setDarkModeState(darkModeValue);
      setUserData(userDataValue);
    };

    initializeAsync();

    toggleSeekToSharedTime(!!urlParams.sharedPlayerTime);

    const url = new URL(window.location.href);
    ['playerProvider', 'playerTeam', 'playerEpisode', 'time'].forEach((param) =>
      url.searchParams.delete(param),
    );

    history.replaceState(history.state, '', url.href);

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
          Програвач
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
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div
              className={cn(isFullscreen && 'absolute inset-0 z-10 size-full')}
            >
              <AspectRatio ratio={16 / 9}>
                {/* <div className="absolute h-[100%] w-[100%] bg-white blur-lg z-[-1] opacity-50" /> */}
                <iframe
                  id="player-iframe"
                  src={`${playerContext.playerState.episode.video_url}?site=hikka.io`}
                  loading="lazy"
                  style={{
                    borderRadius: '10px',
                    height: '100%',
                    width: '100%',
                    zIndex: 2,
                  }}
                  allow="fullscreen; accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                  allowFullScreen
                ></iframe>
              </AspectRatio>
            </div>
            <div className="flex items-center justify-end gap-2">
              {getUserData && (
                <WatchTogetherControls
                  container={container}
                  playerState={playerContext.playerState}
                  setPlayerState={playerContext.setPlayerState}
                  animeSlug={anime_data.slug}
                />
              )}
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEnterFullscreen}
                >
                  <MaterialSymbolsFullscreen className="flex-1" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    toggleTheatreState(!getTheatreState);
                  }}
                >
                  <MaterialSymbolsWidthFullOutlineSharp className="flex-1" />
                </Button>
                <ShareLinkButton
                  container={container}
                  time={time}
                  isTimecodeLink={isTimecodeLink}
                  timecodeLink={timecodeLink}
                  setTimecodeLink={setTimecodeLink}
                  toggleTimestampLink={toggleTimestampLink}
                />
              </div>
            </div>
          </div>
          <div className="flex min-h-0 w-80 flex-col gap-4 rounded-md bg-secondary/30 p-4">
            <Tabs
              value={playerContext.playerState.provider}
              onValueChange={(value) =>
                handleSelectPlayer(value as PlayerSource)
              }
            >
              <TabsList className="w-full">
                {playersAvaliable(data).map((elem) => (
                  <TabsTrigger key={elem} value={elem} className="flex-1">
                    {elem.toUpperCase()}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Select
              value={playerContext.playerState.team}
              onValueChange={handleSelectTeam}
            >
              <SelectTrigger className="text-left">
                <SelectValue placeholder="Team name">
                  {playerContext.playerState.team}
                </SelectValue>
              </SelectTrigger>
              <SelectContent container={container}>
                {Object.keys(data[playerContext.playerState.provider]).map(
                  (elem) => (
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
                  ),
                )}
              </SelectContent>
            </Select>
            {data['type'] !== 'movie' && (
              <ScrollArea className="flex-1 rounded-md border bg-background p-2">
                {episodesData.map((ep) => (
                  <Button
                    key={ep.episode}
                    variant="ghost"
                    ref={
                      ep.episode == playerContext.playerState.episode.episode
                        ? currentEpisodeRef
                        : null
                    }
                    className={cn(
                      'w-full justify-start border',
                      ep.episode == playerContext.playerState.episode.episode
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
        </div>
      </CardContent>
    </Card>
  );
};
