import { create } from 'zustand';

import { usePlayer } from '@/entrypoints/content/features/player/context/player-context';
import {
  type IFramePlayerEvent,
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
  /** Prevents auto-hiding the overlay UI (e.g. while a menu is open) */
  uiLocked: boolean;
  endedCount: number;
}

interface IFramePlayerActions {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  toggleMute: () => void;
  setCurrentQuality: (quality: string) => void;
  setCurrentSubtitle: (subtitle: string) => void;
  changeVolume: (volume: number) => void;
  changeSpeed: (speed: number) => void;
  checkBuffering: () => void;
  reset: () => void;
}

/** A playback change the user asked for, unlike one the player reports. */
export type PlaybackIntent =
  | { type: 'play' | 'pause' }
  | { type: 'seek'; position: number }
  | { type: 'rate'; rate: number };

let playbackIntentListener: ((intent: PlaybackIntent) => void) | undefined;

/** Lets watch together share the user's playback changes with the room. */
export const onPlaybackIntent = (
  listener: ((intent: PlaybackIntent) => void) | undefined,
) => {
  playbackIntentListener = listener;
};

let nextTrackListener: (() => void) | undefined;

/**
 * Lets the player skip to what follows when the episode's player asks: from
 * media keys, or the picture-in-picture window's next button.
 */
export const onNextTrack = (listener: (() => void) | undefined) => {
  nextTrackListener = listener;
};

const UI_HIDE_MS = 4000;

/** The overlay's controls: shown on activity, hidden again during playback. */
class PlayerControls {
  private hideTimer?: ReturnType<typeof setTimeout>;

  /** Shows the controls, which hide again in a moment. */
  show = () => {
    useIFramePlayer.setState({ uiShown: true });
    this.scheduleHide();
  };

  /** Hides the controls in a moment, unless playback stops or they're held. */
  scheduleHide = () => {
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => {
      const { isPlaying, uiLocked } = useIFramePlayer.getState();
      if (isPlaying && !uiLocked) useIFramePlayer.setState({ uiShown: false });
    }, UI_HIDE_MS);
  };

  cancelHide = () => clearTimeout(this.hideTimer);
}

export const playerControls = new PlayerControls();

/** A new episode's player starts from this; its provider sets the speeds. */
const initialPlayback: Omit<IFramePlayerState, 'speedOptions'> = {
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
  uiLocked: false,
  endedCount: 0,
};

export const useIFramePlayer = create<IFramePlayerState & IFramePlayerActions>(
  (set, get) => ({
    ...initialPlayback,
    speedOptions: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],

    play: () => {
      sendIFramePlayerCommand({ action: 'play' });
      playbackIntentListener?.({ type: 'play' });
    },

    pause: () => {
      sendIFramePlayerCommand({ action: 'pause' });
      playbackIntentListener?.({ type: 'pause' });
    },

    toggleMute: () => {
      sendIFramePlayerCommand({ action: get().isMuted ? 'unmute' : 'mute' });
    },

    seek: (time: number) => {
      sendIFramePlayerCommand({ action: 'seek', value: time });
      playbackIntentListener?.({ type: 'seek', position: time });
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
      playbackIntentListener?.({ type: 'rate', rate: speed });
    },

    checkBuffering: () => {
      sendIFramePlayerCommand({ action: 'get-buffered' });
    },

    reset: () => set(initialPlayback),
  }),
);

const getCurrentPlayerIFrameWindow = () => {
  const container = usePlayer.getState().container;
  const iframe = (container?.querySelector('#player-iframe') ??
    document.getElementById('player-iframe')) as HTMLIFrameElement | null;

  return iframe?.contentWindow;
};

const set = useIFramePlayer.setState;

const strings = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && !!item)
    : [];

/** The selected subtitle, or the list of them. */
const subtitles = ({ data, answer }: IFramePlayerEvent) => {
  if (data !== undefined) {
    set({ currentSubtitle: typeof data === 'string' ? data : '' });
  } else if (Array.isArray(answer)) {
    set({ subtitles: strings(answer) });
  }
};

/** How the store follows each event the episode's player reports. */
const PLAYER_EVENTS: Record<string, (event: IFramePlayerEvent) => void> = {
  inited: () => set({ isReady: true }),
  start: () => {
    sendIFramePlayerCommand({ action: 'get-quality' });
    sendIFramePlayerCommand({ action: 'get-qualities' });
    sendIFramePlayerCommand({ action: 'get-subtitles' });
    sendIFramePlayerCommand({ action: 'get-volume' });
  },
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  end: () =>
    set((state) => ({ endedCount: state.endedCount + 1, isPlaying: false })),
  nexttrack: () => nextTrackListener?.(),
  duration: ({ data }) => set({ duration: Number(data) }),
  time: ({ data }) => set({ currentTime: Number(data) }),
  mute: () => set({ isMuted: true }),
  unmute: () => set({ isMuted: false }),
  volume: ({ data, answer }) => set({ volume: Number(data ?? answer) }),
  quality: ({ data, answer }) => {
    const quality = data ?? answer;
    if (typeof quality !== 'string' || !quality) return;
    if (quality === '1') sendIFramePlayerCommand({ action: 'get-quality' });
    else set({ currentQuality: quality });
  },
  qualities: ({ answer }) => {
    if (!Array.isArray(answer)) return;
    if (answer[0] === 1) sendIFramePlayerCommand({ action: 'get-qualities' });
    else set({ qualities: strings(answer) });
  },
  speed: ({ data, answer }) => {
    if (data || answer) set({ currentSpeed: Number(data || answer) });
  },
  vast_start: () => set({ adInProgress: true }),
  vast_finish: () => set({ adInProgress: false }),
  buffering: () => set({ isBuffering: true }),
  buffered: ({ answer }) =>
    set({ isBuffering: false, bufferedTime: Number(answer) }),
  subtitle: subtitles,
  subtitles,
  pip: ({ data }) => {
    const { setVideoPiPActive } = usePlayer.getState();
    if (!data) setVideoPiPActive(false);
    else if (
      useSettings.getState().features.player.miniModeType === 'video-native'
    ) {
      setVideoPiPActive(true);
    }
  },
  ui: ({ data }) => {
    const shouldShow = Boolean(data);
    if (
      !shouldShow &&
      (useIFramePlayer.getState().uiLocked ||
        usePlayer.getState().overlay?.matches(':hover'))
    ) {
      return;
    }
    set({ uiShown: shouldShow });
  },
};

window.addEventListener('message', (event: MessageEvent) => {
  if (!isIFramePlayerEvent(event.data)) return;
  const iframeWindow = getCurrentPlayerIFrameWindow();
  if (!iframeWindow || event.source !== iframeWindow) return;
  if (event.data.event !== 'inited' && !useIFramePlayer.getState().isReady) {
    return;
  }
  if (Object.hasOwn(PLAYER_EVENTS, event.data.event)) {
    PLAYER_EVENTS[event.data.event]!(event.data);
  }
});
