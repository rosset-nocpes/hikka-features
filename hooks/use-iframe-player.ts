import { create } from 'zustand';

import { usePlayer } from '@/entrypoints/content/features/player/context/player-context';
import {
  isIFramePlayerEvent,
  sendIFramePlayerCommand,
} from '@/integrations/iframe-player/protocol';

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
      sendIFramePlayerCommand({ action: 'play' });
    },

    pause: () => {
      sendIFramePlayerCommand({ action: 'pause' });
    },

    toggleMute: () => {
      if (get().isMuted) {
        sendIFramePlayerCommand({ action: 'unmute' });
      } else {
        sendIFramePlayerCommand({ action: 'mute' });
      }
    },

    mute: () => {
      sendIFramePlayerCommand({ action: 'mute' });
    },

    unmute: () => {
      sendIFramePlayerCommand({ action: 'unmute' });
    },

    seek: (time: number) => {
      sendIFramePlayerCommand({ action: 'seek', value: time });
    },

    setCurrentQuality: (quality: string) => {
      const { qualities } = get();
      const index = qualities.findIndex((q) => q === quality);

      sendIFramePlayerCommand({
        action: 'set-quality',
        value: quality,
        index,
      });
    },

    setCurrentSubtitle: (subtitle: string) => {
      const { subtitles } = get();
      const index = subtitles.findIndex((s) => s === subtitle);

      sendIFramePlayerCommand({
        action: 'set-subtitle',
        value: subtitle,
        index,
      });
    },

    changeVolume: (volume: number) => {
      sendIFramePlayerCommand({ action: 'set-volume', value: volume });
    },

    changeSpeed: (speed: number) => {
      const { speedOptions } = get();
      const index = speedOptions.findIndex((q) => q === speed);

      sendIFramePlayerCommand({
        action: 'set-speed',
        value: speed,
        index,
      });
    },

    checkBuffering: () => {
      sendIFramePlayerCommand({ action: 'get-buffered' });
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
  if (isIFramePlayerEvent(event.data)) {
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
          volume: Number(event.data.data ?? event.data.answer),
        });
        break;
      case 'inited':
        useIFramePlayer.setState({ isReady: true });
        break;
      case 'start':
        sendIFramePlayerCommand({ action: 'get-quality' });
        sendIFramePlayerCommand({ action: 'get-qualities' });
        sendIFramePlayerCommand({ action: 'get-subtitles' });
        sendIFramePlayerCommand({ action: 'get-volume' });
        break;
      case 'end':
        useIFramePlayer.setState((state) => ({
          endedCount: state.endedCount + 1,
          isPlaying: false,
        }));
        break;
      case 'quality':
        const quality = event.data.data ?? event.data.answer;
        if (typeof quality !== 'string' || !quality) break;

        if (quality === '1') {
          sendIFramePlayerCommand({ action: 'get-quality' });
          break;
        }

        useIFramePlayer.setState({ currentQuality: quality });
        break;
      case 'qualities':
        if (!Array.isArray(event.data.answer)) break;

        if (event.data.answer[0] === 1) {
          sendIFramePlayerCommand({ action: 'get-qualities' });
          break;
        }

        useIFramePlayer.setState({
          qualities: event.data.answer.filter(
            (quality): quality is string =>
              typeof quality === 'string' && !!quality,
          ),
        });
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
        if (event.data.data !== undefined) {
          useIFramePlayer.setState({
            currentSubtitle:
              typeof event.data.data === 'string' ? event.data.data : '',
          });
          break;
        }

        if (Array.isArray(event.data.answer)) {
          useIFramePlayer.setState({
            subtitles: event.data.answer.filter(
              (subtitle): subtitle is string =>
                typeof subtitle === 'string' && !!subtitle,
            ),
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
