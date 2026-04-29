import { create } from 'zustand';

interface IFramePlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  currentTime: number;
  volume: number;
  duration: number;
}

interface IFramePlayerActions {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  toggleMute: () => void;
  mute: () => void;
  unmute: () => void;
  changeVolume: (volume: number) => void;
}

export const useIFramePlayer = create<IFramePlayerState & IFramePlayerActions>(
  (set, get) => ({
    isPlaying: false,
    isMuted: false,
    currentTime: 0,
    volume: 1,
    duration: 0,

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

    changeVolume: (volume: number) => {
      browser.runtime.sendMessage({
        type: 'playerjs-command',
        api: 'volume',
        param: volume,
      });
    },
  }),
);

window.addEventListener('message', (event: MessageEvent) => {
  if (event.data?.type === 'playerjs-event') {
    console.log(event.data);
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
    }
  }
});
