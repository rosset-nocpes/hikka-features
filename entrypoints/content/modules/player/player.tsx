import { QueryClientProvider } from '@tanstack/react-query';
import type { MediaPlayerInstance } from '@vidstack/react';
import { createRoot } from 'react-dom/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { queryClient } from '../..';
import {
  getWatched,
  PlayerProvider,
  usePlayer,
} from './context/player-context';
import PlayerNavbar from './player-navbar';
import PlayerSidebar from './sidebar/player-sidebar';
import PlayerToolbar from './toolbar/player-toolbar';

export default function player() {
  return createShadowRootUi(usePageStore.getState().ctx, {
    name: 'player-ui',
    position: 'modal',
    zIndex: 100,
    inheritStyles: true,
    async onMount(container) {
      usePlayer.getState().setContainer(container);

      const wrapper = document.createElement('div');
      container.append(wrapper);

      wrapper.className =
        'size-full backdrop-blur-sm bg-black/60 flex items-center justify-center sm:p-8';

      container.className = 'h-full';
      container.classList.toggle('dark', await darkMode.getValue());

      const root = createRoot(wrapper);
      root.render(
        <QueryClientProvider client={queryClient}>
          <SidebarProvider className="h-full w-full">
            <PlayerProvider container={container}>
              <div
                className="fixed z-0 size-full"
                onClick={() => player().then((x) => x.remove())}
              />
              <Player />
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

      usePlayer.getState().reset();
    },
  });
}

export const Player = () => {
  const {
    container,
    sharedParams,
    isShared,
    setSharedStatus,
    provider,
    team,
    currentEpisode,
    setEpisode,
  } = usePlayer();
  const { data } = useWatchData();

  const { open, setOpen } = useSidebar();
  if (isShared) setOpen(false);

  const [isPlayerReady, togglePlayerReady] = useState(false);
  const [getNextEpState, setNextEpState] = useState(false);
  const [getWatchedState, toggleWatchedState] = useState(false);
  const [getTheatreState, toggleTheatreState] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTimecodeLink, toggleTimestampLink] = useState(false);
  const [timecodeLink, setTimecodeLink] = useState(0);

  const VidStackPlayerRef = useRef<MediaPlayerInstance>(null);
  const [showControls, setShowControls] = useState(true);

  const handleSelectEpisode = (value: API.EpisodeData) => {
    setEpisode(value);
    toggleWatchedState(false);
    togglePlayerReady(false);
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

  const [time, setTime] = useState(0);
  const isHandlingNext = useRef(false);

  useEffect(() => {
    if (!container) return;

    const playerIframe = container.querySelector(
      '#player-iframe',
    ) as HTMLIFrameElement;

    const messageHandler = (event: MessageEvent) => {
      switch (event.data.event) {
        case 'init': {
          togglePlayerReady(true);

          if (getNextEpState && !isHandlingNext.current) {
            isHandlingNext.current = true;
            setNextEpState(false);
            playerIframe.contentWindow?.postMessage({ api: 'play' }, '*');

            setTimeout(() => {
              isHandlingNext.current = false;
            }, 1000);
          }

          if (isShared) {
            setSharedStatus(false);
            playerIframe.contentWindow?.postMessage(
              { api: 'play', set: `[seek:${sharedParams?.time}]` },
              '*',
            );
          }
          break;
        }

        case 'time': {
          const message = event.data;
          setTime(message.time);

          if (
            message.time / message.duration > 0.88 &&
            !getWatchedState &&
            isPlayerReady
          ) {
            if (getWatched() + 1 === currentEpisode!.episode) {
              (
                document.body.querySelector(
                  'div.rounded-lg.border:nth-child(2) button',
                ) as HTMLButtonElement
              )?.click();
              toggleWatchedState(true);
            }
          }
          break;
        }

        case 'end': {
          const nextEpisode = data![provider!][team!].find(
            (episode: API.EpisodeData) =>
              episode.episode === currentEpisode!.episode + 1,
          );

          if (!getNextEpState && nextEpisode) {
            setNextEpState(true);
            handleSelectEpisode(nextEpisode);

            toast(
              `Зараз ви переглядаєте ${nextEpisode.episode} епізод в озвучці ${team}`,
            );
          }
          break;
        }

        case 'ui':
          setShowControls(Boolean(event.data.data));
      }
    };

    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, [
    container,
    getNextEpState,
    isPlayerReady,
    sharedParams,
    isShared,
    provider,
    team,
    currentEpisode,
    data,
    getWatchedState,
  ]);

  useEffect(() => {
    const player = VidStackPlayerRef.current;
    if (!player) return;

    const handleControlsChange = () => {
      setShowControls(player.controls.showing);
    };

    player.addEventListener('controls-change', handleControlsChange);

    setShowControls(player.controls.showing);

    return () => {
      player.removeEventListener('controls-change', handleControlsChange);
    };
  }, [VidStackPlayerRef.current]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          player().then((x) => x.remove());
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <Card
      className={cn(
        'relative z-10 flex size-full overflow-hidden rounded-none duration-300 sm:max-h-[722px] sm:max-w-[1282px] sm:rounded-lg',
        getTheatreState && 'sm:max-h-full sm:max-w-full',
      )}
    >
      <PlayerNavbar showControls={showControls} />
      <CardContent
        className={cn(
          'flex min-h-0 min-w-0 flex-1 flex-col gap-2 p-0 pb-2 duration-300',
          !open && 'gap-0 pb-0',
        )}
      >
        <div
          className={cn(
            'relative h-[81.1%] w-full duration-300',
            isFullscreen ? 'fixed inset-0 z-20 size-full' : 'flex border-b',
            (!open || getTheatreState) && 'h-full',
            !open && 'border-0',
          )}
        >
          {/* Will be used in future */}
          {/* {['ashdi', 'moon'].includes(playerContext.state.provider) ? (
              <iframe
                id="player-iframe"
                src={`${playerContext.state.currentEpisode.video_url}?site=hikka.io?v2=1`} // todo: move params to backend
                loading="lazy"
                className="z-[2] size-full"
                allow="fullscreen; accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
              ></iframe>
            ) : (
              <VidStackPlayer
                url={playerContext.state.currentEpisode.video_url}
                title=""
                data={data!}
                ref={VidStackPlayerRef}
              />
            )} */}
          <iframe
            title="player-iframe"
            id="player-iframe"
            src={`${currentEpisode?.video_url}?site=hikka.io?v2=1`} // todo: move params to backend
            loading="lazy"
            className="z-[2] size-full"
            allow="fullscreen; accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
            allowFullScreen
          ></iframe>
        </div>
        <PlayerToolbar
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
      <PlayerSidebar toggleWatchedState={toggleWatchedState} />
    </Card>
  );
};
