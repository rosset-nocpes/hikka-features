import { create } from 'zustand';

interface IFramePlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  qualities: string[];
  currentQuality: string;
  currentTime: number;
  currentSpeed: number;
  speedOptions: number[];
  volume: number;
  duration: number;
  isBuffering: boolean;
  bufferedTime: number;
  adInProgress: boolean;
}

interface IFramePlayerActions {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  toggleMute: () => void;
  mute: () => void;
  unmute: () => void;
  setCurrentQuality: (quality: string) => void;
  changeVolume: (volume: number) => void;
  changeSpeed: (speed: number) => void;
  checkBuffering: () => void;
  reset: () => void;
}

export const useIFramePlayer = create<IFramePlayerState & IFramePlayerActions>(
  (set, get) => ({
    isPlaying: false,
    isMuted: false,
    qualities: [],
    currentQuality: '',
    currentTime: 0,
    currentSpeed: 1,
    speedOptions: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],
    volume: 1,
    duration: 0,
    isBuffering: false,
    bufferedTime: 0,
    adInProgress: false,

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
        param: time,
      });
    },

    setCurrentQuality: (quality: string) => {
      const { qualities } = get();
      const index = qualities.findIndex((q) => q === quality).toString();

      browser.runtime.sendMessage({
        type: 'playerjs-command',
        api: 'quality',
        param: index,
      });
    },

    changeVolume: (volume: number) => {
      browser.runtime.sendMessage({
        type: 'playerjs-command',
        api: 'volume',
        param: volume,
      });
    },

    changeSpeed: (speed: number) => {
      const { speedOptions } = get();
      const index = speedOptions.findIndex((q) => q === speed).toString();

      browser.runtime.sendMessage({
        type: 'playerjs-command',
        api: 'speed',
        param: index,
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
        isPlaying: false,
        isMuted: false,
        qualities: [],
        currentQuality: '',
        currentTime: 0,
        currentSpeed: 1,
        volume: 1,
        duration: 0,
        isBuffering: false,
        bufferedTime: 0,
        adInProgress: false,
      });
    },
  }),
);

window.addEventListener('message', (event: MessageEvent) => {
  if (event.data?.type === 'playerjs-event') {
    switch (event.data.event) {
      case 'playing':
        useIFramePlayer.setState({ isPlaying: event.data.state });
        break;
      case 'duration':
        useIFramePlayer.setState({ duration: Number(event.data.data) });
        break;
      case 'time':
        useIFramePlayer.setState({ currentTime: Number(event.data.data) });
        break;
      case 'muted':
        useIFramePlayer.setState({ isMuted: event.data.state });
        break;
      case 'volume':
        useIFramePlayer.setState({ volume: Number(event.data.data) });
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
        break;
      case 'quality':
        useIFramePlayer.setState({ currentQuality: event.data.data });
        break;
      case 'speed':
        useIFramePlayer.setState({ currentSpeed: Number(event.data.data) });
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
        useIFramePlayer.setState({ isBuffering: false });
        break;
    }
  }
  if (event.data?.type === 'playerjs-response') {
    switch (event.data.command) {
      case 'qualities':
        if (event.data.data[0] === 1) {
          browser.runtime.sendMessage({
            type: 'playerjs-command',
            api: 'qualities',
          });
        }

        useIFramePlayer.setState({ qualities: event.data.data });
        break;
      case 'quality':
        if (!event.data.data) break;

        if (event.data.data === '1') {
          browser.runtime.sendMessage({
            type: 'playerjs-command',
            api: 'quality',
          });
        }

        useIFramePlayer.setState({ currentQuality: event.data.data });
        break;
      case 'buffered':
        useIFramePlayer.setState({ bufferedTime: event.data.data });
        break;
    }
  }
});
