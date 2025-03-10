import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Toaster } from '@/components/ui/sonner';
import { FC, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { toast } from 'sonner';
import { ContentScriptContext } from 'wxt/client';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';

import PlayerSidebar from './_base/player-sidebar';
import {
  PlayerProvider,
  getWatched,
  playersAvaliable,
  usePlayerContext,
} from './context/player-context';
import PlayerToolbar from './toolbar/player-toolbar';

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

interface AnimeData {
  slug: string;
  // Add other anime data properties as needed
}

interface Props {
  container: HTMLElement;
  ctx: ContentScriptContext;
  data: API.WatchData;
  anime_data: AnimeData;
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

  const [isPlayerReady, togglePlayerReady] = useState(false);
  const [getNextEpState, setNextEpState] = useState(false);
  const [getWatchedState, toggleWatchedState] = useState(false);
  const [getTheatreState, toggleTheatreState] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTimecodeLink, toggleTimestampLink] = useState(false);
  const [timecodeLink, setTimecodeLink] = useState(0);

  const handleSelectEpisode = (value: API.EpisodeData) => {
    playerContext.setState((prev) => ({ ...prev, episode: value }));
    toggleWatchedState(false);
    togglePlayerReady(false);
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

  const handleFullscreenChange = () => {
    if (!document.fullscreenElement) {
      handleExitFullscreen();
    }
  };

  const handleEnterFullscreen = () => {
    setIsFullscreen(true);
    document.documentElement.requestFullscreen();
    document.addEventListener('fullscreenchange', handleFullscreenChange);
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
    document.exitFullscreen();
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
  };

  const [seekToSharedTime, toggleSeekToSharedTime] = useState(false);
  let duration = 0;
  const [time, setTime] = useState(0);
  const isHandlingNext = useRef(false);

  useEffect(() => {
    const messageHandler = (event: MessageEvent) => {
      switch (event.data.event) {
        case 'init':
          togglePlayerReady(true);

          if (getNextEpState && !isHandlingNext.current) {
            isHandlingNext.current = true;
            setNextEpState(false);
            playerIframe.contentWindow?.postMessage({ api: 'play' }, '*');

            toast(
              `Зараз ви переглядаєте ${playerContext.state.currentEpisode.episode} епізод в озвучці ${playerContext.state.team}`,
            );
            setTimeout(() => {
              isHandlingNext.current = false;
            }, 1000);
          }

          if (seekToSharedTime) {
            toggleSeekToSharedTime(false);
            playerIframe.contentWindow?.postMessage(
              { api: 'play', set: `[seek:${urlParams.sharedPlayerTime}]` },
              '*',
            );
          }
          break;

        case 'time':
          const message = event.data;
          duration = message.duration;
          setTime(message.time);

          if (
            message.time / message.duration > 0.88 &&
            !getWatchedState &&
            isPlayerReady
          ) {
            if (
              getWatched() + 1 ===
              playerContext.state.currentEpisode.episode
            ) {
              (
                document.body.querySelector(
                  'div.inline-flex:nth-child(2) button:nth-child(2)',
                ) as HTMLButtonElement
              )?.click();
              toggleWatchedState(true);
            }
          }
          break;

        case 'end':
          if (
            !getNextEpState &&
            data[playerContext.state.provider][playerContext.state.team].find(
              (episode: API.EpisodeData) =>
                episode.episode ===
                playerContext.state.currentEpisode.episode + 1,
            )
          ) {
            setNextEpState(true);
            handleSelectEpisode(
              data[playerContext.state.provider][playerContext.state.team].find(
                (episode: API.EpisodeData) =>
                  episode.episode ===
                  playerContext.state.currentEpisode.episode + 1,
              )!,
            );
          }
          break;
      }
    };

    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, [
    getNextEpState,
    isPlayerReady,
    playerContext.state,
    data,
    getWatchedState,
    seekToSharedTime,
    urlParams.sharedPlayerTime,
  ]);

  // Handle async initialization
  useEffect(() => {
    const initializeAsync = async () => {
      const defaultPlayerValue = await defaultPlayer.getValue();

      if (!urlParams.sharedCheck) {
        handleSelectPlayer(
          playersAvaliable(data).includes(defaultPlayerValue)
            ? defaultPlayerValue
            : defaultPlayerValue === 'moon'
              ? 'ashdi'
              : 'moon',
        );
      }
    };

    initializeAsync();

    toggleSeekToSharedTime(!!urlParams.sharedPlayerTime);

    const url = new URL(window.location.href);
    ['playerProvider', 'playerTeam', 'playerEpisode', 'time'].forEach((param) =>
      url.searchParams.delete(param),
    );

    history.replaceState(history.state, '', url.href);
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
              <AspectRatio
                ratio={16 / 9}
                className="overflow-hidden rounded-sm bg-secondary/30"
              >
                <iframe
                  id="player-iframe"
                  src={`${playerContext.state.currentEpisode.video_url}?site=hikka.io`}
                  loading="lazy"
                  className="z-[2] size-full"
                  allow="fullscreen; accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                  allowFullScreen
                ></iframe>
              </AspectRatio>
            </div>
            <PlayerToolbar
              container={container}
              animeSlug={anime_data.slug}
              time={time}
              isTimecodeLink={isTimecodeLink}
              timecodeLink={timecodeLink}
              setTimecodeLink={setTimecodeLink}
              toggleTimestampLink={toggleTimestampLink}
              toggleTheatreState={toggleTheatreState}
              getTheatreState={getTheatreState}
              handleEnterFullscreen={handleEnterFullscreen}
            />
          </div>
          <PlayerSidebar
            container={container}
            data={data}
            toggleWatchedState={toggleWatchedState}
          />
        </div>
      </CardContent>
    </Card>
  );
};
