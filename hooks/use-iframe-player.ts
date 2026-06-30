import { create } from 'zustand';

import { usePlayer } from '@/entrypoints/content/features/player/context/player-context';

interface IFramePlayerState {
  isReady: boolean;
  isPlaying: boolean;
  isMuted: boolean;
  qualities: string[];
  currentQuality: string;
  currentTime: number;
  currentSpeed: number;
  currentSubtitle: string;
  subtitles: string[];
  speedOptions: number[];
  volume: number;
  duration: number;
  isBuffering: boolean;
  bufferedTime: number;
  adInProgress: boolean;
  uiShown: boolean;
  endedCount: number;
}

interface IFramePlayerActions {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  toggleMute: () => void;
  mute: () => void;
  unmute: () => void;
  setCurrentQuality: (quality: string) => void;
  setCurrentSubtitle: (subtitle: string) => void;
  changeVolume: (volume: number) => void;
  changeSpeed: (speed: number) => void;
  checkBuffering: () => void;
  reset: () => void;
}

export const useIFramePlayer = create<IFramePlayerState & IFramePlayerActions>(
  (set, get) => ({
    isReady: false,
    isPlaying: false,
    isMuted: false,
    qualities: [],
    currentQuality: '',
    currentTime: 0,
    currentSpeed: 1,
    currentSubtitle: '',
    subtitles: [],
    speedOptions: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],
    volume: 1,
    duration: 0,
    isBuffering: false,
    bufferedTime: 0,
    adInProgress: false,
    uiShown: true,
    endedCount: 0,

    play: () => {
      browser.runtime.sendMessage({
        type: 'playerjs-command',
        api: 'play',
      });
    },

    pause: () => {
      browser.runtime.sendMessage({
        type: 'playerjs-command',
        api: 'pause',
      });
    },

    toggleMute: () => {
      if (get().isMuted) {
        browser.runtime.sendMessage({
          type: 'playerjs-command',
          api: 'unmute',
        });
      } else {
        browser.runtime.sendMessage({
          type: 'playerjs-command',
          api: 'mute',
        });
      }
    },

    mute: () => {
      browser.runtime.sendMessage({
        type: 'playerjs-command',
        api: 'mute',
      });
    },

    unmute: () => {
      browser.runtime.sendMessage({
        type: 'playerjs-command',
        api: 'unmute',
      });
    },

    seek: (time: number) => {
      browser.runtime.sendMessage({
        type: 'playerjs-command',
        api: 'seek',
        set: time,
      });
    },

    setCurrentQuality: (quality: string) => {
      const { qualities } = get();
      const index = qualities.findIndex((q) => q === quality).toString();

      browser.runtime.sendMessage({
        type: 'playerjs-command',
        api: 'quality',
        set: index,
      });
    },

    setCurrentSubtitle: (subtitle: string) => {
      const { subtitles } = get();
      const index = subtitles.findIndex((s) => s === subtitle).toString();

      browser.runtime.sendMessage({
        type: 'playerjs-command',
        api: 'subtitle',
        set: index,
      });
    },

    changeVolume: (volume: number) => {
      browser.runtime.sendMessage({
        type: 'playerjs-command',
        api: 'volume',
        set: volume,
      });
    },

    changeSpeed: (speed: number) => {
      const { speedOptions } = get();
      const index = speedOptions.findIndex((q) => q === speed).toString();

      browser.runtime.sendMessage({
        type: 'playerjs-command',
        api: 'speed',
        set: index,
      });
    },

    checkBuffering: () => {
      browser.runtime.sendMessage({
        type: 'playerjs-command',
        api: 'buffered',
      });
    },

    reset: () => {
      set({
        isReady: false,
        isPlaying: false,
        isMuted: false,
        qualities: [],
        currentQuality: '',
        currentTime: 0,
        currentSpeed: 1,
        currentSubtitle: '',
        subtitles: [],
        volume: 1,
        duration: 0,
        isBuffering: false,
        bufferedTime: 0,
        adInProgress: false,
        uiShown: true,
        endedCount: 0,
      });
    },
  }),
);

const getCurrentPlayerIFrameWindow = () => {
  const container = usePlayer.getState().container;
  const iframe = (container?.querySelector('#player-iframe') ??
    document.getElementById('player-iframe')) as HTMLIFrameElement | null;

  return iframe?.contentWindow;
};

const shouldHandlePlayerMessage = (event: MessageEvent) => {
  const currentIFrameWindow = getCurrentPlayerIFrameWindow();

  return !!currentIFrameWindow && event.source === currentIFrameWindow;
};

window.addEventListener('message', (event: MessageEvent) => {
  if (event.data?.event) {
    if (!shouldHandlePlayerMessage(event)) return;
    if (event.data.event !== 'inited' && !useIFramePlayer.getState().isReady) {
      return;
    }

    switch (event.data.event) {
      case 'play':
        useIFramePlayer.setState({ isPlaying: true });
        break;
      case 'pause':
        useIFramePlayer.setState({ isPlaying: false });
        break;
      case 'duration':
        useIFramePlayer.setState({ duration: Number(event.data.data) });
        break;
      case 'time':
        useIFramePlayer.setState({ currentTime: Number(event.data.data) });
        break;
      case 'mute':
        useIFramePlayer.setState({ isMuted: true });
        break;
      case 'unmute':
        useIFramePlayer.setState({ isMuted: false });
        break;
      case 'volume':
        useIFramePlayer.setState({
          volume: Number(event.data.data || event.data.answer),
        });
        break;
      case 'inited':
        useIFramePlayer.setState({ isReady: true });
        break;
      case 'start':
        browser.runtime.sendMessage({
          type: 'playerjs-command',
          api: 'quality',
        });
        browser.runtime.sendMessage({
          type: 'playerjs-command',
          api: 'qualities',
        });
        browser.runtime.sendMessage({
          type: 'playerjs-command',
          api: 'subtitles',
        });
        browser.runtime.sendMessage({
          type: 'playerjs-command',
          api: 'volume',
        });
        break;
      case 'end':
        useIFramePlayer.setState((state) => ({
          endedCount: state.endedCount + 1,
          isPlaying: false,
        }));
        break;
      case 'quality':
        if (!event.data.data && !event.data.answer) break;

        if (event.data.data === '1' || event.data.answer === '1') {
          browser.runtime.sendMessage({
            type: 'playerjs-command',
            api: 'quality',
          });
          break;
        }

        useIFramePlayer.setState({
          currentQuality: event.data.data || event.data.answer,
        });
        break;
      case 'qualities':
        if (event.data.answer[0] === 1) {
          browser.runtime.sendMessage({
            type: 'playerjs-command',
            api: 'qualities',
          });
          break;
        }

        useIFramePlayer.setState({ qualities: event.data.answer });
        break;
      case 'speed':
        if (!event.data.data && !event.data.answer) break;

        useIFramePlayer.setState({
          currentSpeed: Number(event.data.data || event.data.answer),
        });
        break;
      case 'vast_start':
        useIFramePlayer.setState({ adInProgress: true });
        break;
      case 'vast_finish':
        useIFramePlayer.setState({ adInProgress: false });
        break;
      case 'buffering':
        useIFramePlayer.setState({ isBuffering: true });
        break;
      case 'buffered':
        useIFramePlayer.setState({
          isBuffering: false,
          bufferedTime: Number(event.data.answer),
        });
        break;
      case 'subtitle':
      case 'subtitles':
        if (!event.data.data && !event.data.answer) break;

        if (event.data.data) {
          useIFramePlayer.setState({ currentSubtitle: event.data.data });
          break;
        }

        if (event.data.answer) {
          useIFramePlayer.setState({
            subtitles: event.data.answer.filter(Boolean),
          });
          break;
        }

        break;
      case 'pip':
        if (event.data.data) {
          const { miniModeType } = useSettings.getState().features.player;
          if (miniModeType === 'video-native') {
            usePlayer.getState().setVideoPiPActive(true);
          }
        } else {
          usePlayer.getState().setVideoPiPActive(false);
        }
        break;
      case 'ui':
        const shouldShow = Boolean(event.data.data);
        if (!shouldShow) {
          const overlayRef = usePlayer.getState().overlayRef;
          const isOverlayHovered = overlayRef?.current?.matches(':hover');
          if (isOverlayHovered) break;
        }
        useIFramePlayer.setState({ uiShown: shouldShow });
        break;
    }
  }
});
