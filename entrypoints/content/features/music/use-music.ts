import { create } from 'zustand';

import type { CornerStore, FloatingCorner } from '@/hooks/use-floating-card';

import { StoredValue } from '@/utils/stored-value';

import { type MusicTrack, OST_LABEL } from './animethemes';

interface MusicState {
  /** What plays, in order; empty while the player is closed. */
  queue: MusicTrack[];
  index: number;
  playing: boolean;
  /** Waiting for the audio to start or to buffer. */
  loading: boolean;
  /** The track's audio didn't load. */
  failed: boolean;
  currentTime: number;
  duration: number;
  bufferedTime: number;
  /** 0 to 1; kept between visits. */
  volume: number;
  muted: boolean;
  corner: FloatingCorner;
}

interface MusicActions {
  /** Plays `queue` from `index`. */
  playQueue: (queue: MusicTrack[], index: number) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  next: () => void;
  /** Back to the track's start, or the track before it right after starting. */
  previous: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}

/** Past this, "previous" restarts the track instead. */
const RESTART_AFTER_S = 3;

const idle = {
  queue: [] as MusicTrack[],
  index: 0,
  playing: false,
  loading: false,
  failed: false,
  currentTime: 0,
  duration: 0,
  bufferedTime: 0,
};

/** The element that is heard; others only ever play muted. */
let element: HTMLAudioElement | undefined;

const storedVolume = new StoredValue<number>('music-volume');
let saveVolume = 0;

/*
 * AnimeThemes' audio is Ogg Opus without a seek index. Right after a seek,
 * Chrome's demuxer lets a moment of other audio through, often the song's
 * last second, and a volume change takes as long to reach the speakers as
 * the seek, so fading out can't reliably cover it. Instead a muted twin of
 * the element seeks and starts playing; once it has played cleanly from the
 * new time it crossfades in, so the leak is never heard and the music never
 * stops. A seek while paused mutes the element until it plays cleanly again.
 */
/** How far past its target a seek has to play before it is heard. */
const SETTLE_S = 0.12;
const CROSSFADE_MS = 120;
/** Fades in a paused seek once it plays. */
const FADE_IN_MS = 150;
const STEP_MS = 10;
/** A twin that hasn't settled by then (a stalled load) gives way. */
const TWIN_DEADLINE_MS = 4000;
/** A seek to where the last one went, this soon, is the same seek again. */
const REPEAT_MS = 1000;
const REPEAT_S = 0.05;

/** A seek that plays muted until it settles. */
let twin:
  | { el: HTMLAudioElement; target: number; poll: number; since: number }
  | undefined;
/** A paused seek's target, until it has played cleanly. */
let quietTarget: number | undefined;
let quietPoll = 0;
let fade: { timer: number; finish: () => void } | undefined;
let lastSeek = { time: Number.NaN, at: 0 };

const userVolume = () => useMusic.getState().volume;

const dispose = (el: HTMLAudioElement) => {
  el.pause();
  el.removeAttribute('src');
  el.load();
};

/** Runs `step(progress)` from 0 to 1 over `ms`, then `done`. */
const animate = (
  ms: number,
  step: (progress: number) => void,
  done: () => void,
) => {
  finishFade();
  const start = performance.now();
  const finish = () => {
    clearInterval(timer);
    fade = undefined;
    step(1);
    done();
  };
  // Timers, not frames: a hidden tab gets no frames.
  const timer = window.setInterval(() => {
    const progress = (performance.now() - start) / ms;
    if (progress >= 1) finish();
    else step(progress);
  }, STEP_MS);
  fade = { timer, finish };
  step(0);
};

const finishFade = () => fade?.finish();

/** Whether `el` plays cleanly from `target`: done seeking, data at hand, past the leak. */
const settled = (el: HTMLAudioElement, target: number) =>
  el.ended ||
  (!el.seeking && el.readyState >= 3 && el.currentTime >= target + SETTLE_S);

const dropTwin = () => {
  if (!twin) return;
  clearInterval(twin.poll);
  dispose(twin.el);
  twin = undefined;
};

const dropQuiet = () => {
  clearInterval(quietPoll);
  quietTarget = undefined;
};

/** Makes the settled twin the heard element, crossfading from the old one. */
const swapToTwin = () => {
  if (!twin || !element) return;
  const old = element;
  const next = twin.el;
  clearInterval(twin.poll);
  twin = undefined;

  element = next;
  const from = old.volume;
  next.volume = 0;
  next.muted = useMusic.getState().muted;
  useMusic.setState({
    loading: false,
    currentTime: next.currentTime,
    playing: !next.paused,
  });
  animate(
    CROSSFADE_MS,
    (progress) => {
      next.volume = userVolume() * progress;
      old.volume = from * (1 - progress);
    },
    () => dispose(old),
  );
  // A seek to the very end: its `ended` went by while it was the twin.
  if (next.ended) {
    const { queue, index } = useMusic.getState();
    if (index < queue.length - 1) useMusic.getState().next();
    else useMusic.setState({ playing: false });
  }
};

const seekWhilePlaying = (player: HTMLAudioElement, time: number) => {
  if (!twin) {
    const el = createElement();
    el.muted = true;
    el.src = player.currentSrc || player.src;
    twin = { el, target: time, poll: 0, since: 0 };
  }
  const current = twin;
  current.target = time;
  current.since = Date.now();
  current.el.currentTime = time;
  current.el.play().catch(() => undefined);
  useMusic.setState({ loading: true });
  clearInterval(current.poll);
  current.poll = window.setInterval(() => {
    if (settled(current.el, current.target)) swapToTwin();
    else if (Date.now() - current.since > TWIN_DEADLINE_MS) fallBackFromTwin();
  }, STEP_MS * 2);
};

/**
 * When the twin can't settle (its load failed or stalled), the heard
 * element seeks itself: a leak is better than a seek that never lands.
 */
const fallBackFromTwin = () => {
  if (!twin || !element) return;
  const { target } = twin;
  dropTwin();
  element.currentTime = target;
  useMusic.setState({ loading: false, currentTime: target });
};

/** Mutes a paused element at its new time until it has played cleanly from it. */
const seekWhilePaused = (player: HTMLAudioElement, time: number) => {
  dropQuiet();
  finishFade();
  player.volume = 0;
  player.currentTime = time;
  quietTarget = time;
};

/** Once the paused seek plays cleanly, fades the element back in. */
const releaseQuiet = () => {
  const player = element;
  if (quietTarget === undefined || !player) return;
  clearInterval(quietPoll);
  quietPoll = window.setInterval(() => {
    if (quietTarget === undefined || !settled(player, quietTarget)) return;
    dropQuiet();
    animate(
      FADE_IN_MS,
      (progress) => {
        player.volume = userVolume() * progress;
      },
      () => undefined,
    );
  }, STEP_MS * 2);
};

const seekAudio = (time: number) => {
  const player = element;
  if (!player?.currentSrc) return;
  // The slider seeks as it's pressed and again as it's let go.
  const now = Date.now();
  if (
    Math.abs(time - lastSeek.time) < REPEAT_S &&
    now - lastSeek.at < REPEAT_MS
  ) {
    return;
  }
  lastSeek = { time, at: now };

  if (player.paused) {
    dropTwin();
    seekWhilePaused(player, time);
  } else {
    // A paused seek still settling gives way to this one.
    dropQuiet();
    finishFade();
    seekWhilePlaying(player, time);
  }
};

/** Stops any seek in flight, e.g. for another track; the heard element stays. */
const cancelSeeks = () => {
  dropTwin();
  dropQuiet();
  finishFade();
  lastSeek = { time: Number.NaN, at: 0 };
  applyVolume();
};

const applyVolume = () => {
  // A paused seek's element stays silent until it settles.
  if (element && quietTarget === undefined && !fade) {
    element.volume = userVolume();
  }
};

/** An audio element whose events reach the store while it is the heard one. */
const createElement = () => {
  const el = new Audio();
  el.preload = 'auto';

  const set = (state: Partial<MusicState>) => useMusic.setState(state);
  const on = (type: string, listener: () => void) =>
    el.addEventListener(type, () => {
      if (el === element) listener();
    });

  on('play', () => {
    set({ playing: true, failed: false });
    releaseQuiet();
  });
  on('pause', () => {
    set({ playing: false });
    clearInterval(quietPoll);
    // Paused from outside the store (media keys, the system): a settling
    // seek lands where it was going, paused, as `pause` does.
    if (twin) {
      const { target } = twin;
      dropTwin();
      seekWhilePaused(el, target);
    }
  });
  on('waiting', () => set({ loading: true }));
  on('playing', () => set({ loading: !!twin }));
  on('canplay', () => set({ loading: !!twin }));
  // While a twin settles, the old time would pull the bar back.
  on('timeupdate', () => {
    if (!twin) set({ currentTime: el.currentTime });
  });
  on('durationchange', () =>
    set({ duration: Number.isFinite(el.duration) ? el.duration : 0 }),
  );
  on('progress', () => {
    const { buffered } = el;
    set({
      bufferedTime: buffered.length ? buffered.end(buffered.length - 1) : 0,
    });
  });
  on('ended', () => {
    // A seek away from the end is still settling; it plays on from there.
    if (twin) return;
    const { queue, index } = useMusic.getState();
    if (index < queue.length - 1) useMusic.getState().next();
  });
  on('error', () => {
    // Also fires when the source is cleared on stop.
    if (!el.getAttribute('src')) return;
    set({ failed: true, loading: false, playing: false });
  });
  // A twin that can't load: seek the heard element instead.
  el.addEventListener('error', () => {
    if (twin?.el === el) fallBackFromTwin();
  });
  return el;
};

/** The heard element, outside React, so it plays on through re-renders. */
const audio = () => {
  if (element) return element;
  element = createElement();
  element.volume = userVolume();
  element.muted = useMusic.getState().muted;
  return element;
};

/** Counts loads, so an older one's failure can't touch a newer track. */
let loads = 0;

const load = (track: MusicTrack) => {
  const current = ++loads;
  const player = audio();
  cancelSeeks();
  useMusic.setState({
    ...idle,
    loading: true,
    queue: useMusic.getState().queue,
    index: useMusic.getState().index,
  });
  player.src = track.audio;
  player.play().catch(() => {
    // Autoplay refused (no gesture, e.g. from media keys): shown paused.
    if (current === loads) useMusic.setState({ loading: false });
  });
  updateMediaSession(track);
};

export const useMusic = create<MusicState & MusicActions>((set, get) => ({
  ...idle,
  volume: 1,
  muted: false,
  corner: 'bottom-right',

  playQueue: (queue, index) => {
    const track = queue[index];
    if (!track) return;
    const current = get().queue[get().index];
    set({ queue, index });
    if (current?.key === track.key && !get().failed) get().play();
    else load(track);
  },
  play: () => {
    const track = get().queue[get().index];
    if (!track) return;
    if (get().failed) return load(track);
    audio()
      .play()
      .catch(() => undefined);
  },
  pause: () => {
    finishFade();
    // A seek still settling lands where it was going, paused.
    const pending = twin?.target;
    dropTwin();
    if (!element) return;
    element.pause();
    if (pending !== undefined) seekWhilePaused(element, pending);
  },
  toggle: () => (get().playing ? get().pause() : get().play()),
  seek: (time) => {
    seekAudio(time);
    set({ currentTime: time });
  },
  next: () => {
    const { queue, index } = get();
    const track = queue[index + 1];
    if (!track) return;
    set({ index: index + 1 });
    load(track);
  },
  previous: () => {
    const { queue, index, currentTime } = get();
    const track = queue[index - 1];
    if (!track || currentTime > RESTART_AFTER_S) return get().seek(0);
    set({ index: index - 1 });
    load(track);
  },
  stop: () => {
    cancelSeeks();
    if (element) dispose(element);
    set(idle);
    updateMediaSession(undefined);
  },
  setVolume: (volume) => {
    set({ volume, muted: volume === 0 });
    applyVolume();
    if (element) element.muted = volume === 0;
    // Once the slider rests.
    clearTimeout(saveVolume);
    saveVolume = window.setTimeout(() => void storedVolume.set(volume), 300);
  },
  toggleMute: () => {
    const muted = !get().muted;
    // Unmuting from zero would stay silent.
    if (!muted && get().volume === 0) return get().setVolume(0.5);
    set({ muted });
    if (element) element.muted = muted;
  },
}));

void storedVolume.get().then((volume) => {
  if (volume !== undefined) useMusic.setState({ volume });
  applyVolume();
});

export const currentTrack = ({ queue, index }: MusicState) => queue[index];

export const musicCorner: CornerStore = {
  get: () => useMusic.getState().corner,
  set: (corner) => useMusic.setState({ corner }),
};

export const trackLabel = (track: MusicTrack) =>
  `${OST_LABEL[track.type]} ${track.index}`;

/** The OS's media controls and keys, for the playing track. */
const updateMediaSession = (track: MusicTrack | undefined) => {
  try {
    const session = navigator.mediaSession;
    if (!track) {
      session.metadata = null;
      return;
    }
    session.metadata = new MediaMetadata({
      title: track.title,
      artist: track.author ?? trackLabel(track),
      album: track.animeTitle ?? '',
      artwork: track.poster ? [{ src: track.poster }] : [],
    });
    const music = useMusic.getState();
    session.setActionHandler('play', music.play);
    session.setActionHandler('pause', music.pause);
    session.setActionHandler('previoustrack', music.previous);
    session.setActionHandler('nexttrack', music.next);
    session.setActionHandler('seekto', ({ seekTime }) => {
      if (seekTime !== undefined) useMusic.getState().seek(seekTime);
    });
  } catch {
    // Not every browser lets a content script set these; the bar still works.
  }
};
