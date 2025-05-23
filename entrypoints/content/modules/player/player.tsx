import { ContentScriptContext } from '#imports';
import { Card, CardContent } from '@/components/ui/card';
import { Toaster } from '@/components/ui/sonner';
import { FC, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { toast } from 'sonner';

import { SidebarProvider } from '@/components/ui/sidebar';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../..';
import {
  PlayerProvider,
  getWatched,
  playersAvaliable,
  usePlayerContext,
} from './context/player-context';
import PlayerSidebar from './sidebar/player-sidebar';
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
        <QueryClientProvider client={queryClient}>
          <SidebarProvider className="h-full w-full">
            <PlayerProvider data={data!} anime_data={anime_data}>
              <div
                className="fixed z-0 size-full"
                onClick={() =>
                  player(ctx, data!, anime_data)!.then((x) => x!.remove())
                }
              />
              <Player container={container} ctx={ctx} />
              <Toaster position="top-center" />
            </PlayerProvider>
          </SidebarProvider>
        </QueryClientProvider>,
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
}

export const Player: FC<Props> = ({ container, ctx }) => {
  const playerContext = usePlayerContext();
  const { data } = useWatchData(playerContext.state.animeData);

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
  // const [showSidebar, toggleSidebar] = useState(true);

  const handleSelectEpisode = (value: API.EpisodeData) => {
    playerContext.setState((prev) => ({ ...prev, currentEpisode: value }));
    toggleWatchedState(false);
    togglePlayerReady(false);
  };

  const handleSelectPlayer = (value: PlayerSource) => {
    const newTeamName = Object.keys(data![value])[0];
    const newEpisode =
      data![value][newTeamName].find(
        (episode: API.EpisodeData) => episode.episode === getWatched() + 1,
      ) || data![value][newTeamName][0];

    const newEpisodeData = data![value][newTeamName];

    playerContext.setState((prev) => ({
      ...prev,
      provider: value,
      team: newTeamName,
      episodeData: newEpisodeData,
      currentEpisode: newEpisode,
    }));
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
          const nextEpisode = data![playerContext.state.provider][
            playerContext.state.team
          ].find(
            (episode: API.EpisodeData) =>
              episode.episode ===
              playerContext.state.currentEpisode.episode + 1,
          );

          if (!getNextEpState && nextEpisode) {
            setNextEpState(true);
            handleSelectEpisode(nextEpisode);
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
          playersAvaliable(data!).includes(defaultPlayerValue)
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
        'relative z-10 flex size-full max-h-[720px] max-w-[1280px] overflow-hidden',
        getTheatreState && 'h-full',
      )}
    >
      <div className="flex flex-1 flex-col">
        <CardContent className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 p-2">
          <div
            className={cn(
              isFullscreen
                ? 'fixed inset-0 z-20 size-full'
                : 'aspect-video overflow-hidden rounded-sm bg-secondary/30',
            )}
          >
            <iframe
              id="player-iframe"
              src={`${playerContext.state.currentEpisode.video_url}?site=hikka.io`}
              loading="lazy"
              className="z-[2] size-full"
              allow="fullscreen; accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
              allowFullScreen
            ></iframe>
          </div>
          <PlayerToolbar
            container={container}
            time={time}
            isTimecodeLink={isTimecodeLink}
            timecodeLink={timecodeLink}
            setTimecodeLink={setTimecodeLink}
            toggleTimestampLink={toggleTimestampLink}
            toggleTheatreState={toggleTheatreState}
            getTheatreState={getTheatreState}
            handleEnterFullscreen={handleEnterFullscreen}
          />
        </CardContent>
      </div>
      <PlayerSidebar
        container={container}
        ctx={ctx}
        toggleWatchedState={toggleWatchedState}
      />
    </Card>
  );
};
