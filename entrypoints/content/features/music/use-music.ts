import { create } from 'zustand';

import type { CornerStore, FloatingCorner } from '@/hooks/use-floating-card';

import { STORAGE_KEYS } from '@/constants/storage';
import { StoredValue } from '@/utils/stored-value';

import { type MusicTrack, OST_LABEL } from './animethemes';
import {
  RESTART_AFTER_S,
  SETTLE_S,
  CROSSFADE_MS,
  FADE_IN_MS,
  STEP_MS,
  TWIN_DEADLINE_MS,
  REPEAT_MS,
  REPEAT_S,
} from './music.constants';

/** After the last track: stop, start over, or the same track again and again. */
export type RepeatMode = 'off' | 'all' | 'one';

/** The repeat modes in the order the button goes through them. */
const REPEAT_MODES: readonly RepeatMode[] = ['off', 'all', 'one'];

interface MusicState {
  /** What plays, in order; empty while the player is closed. */
  queue: MusicTrack[];
  /** The queue as it was given, while `queue` plays it shuffled. */
  unshuffled?: MusicTrack[];
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
  /** Both kept between visits. */
  repeat: RepeatMode;
  shuffle: boolean;
  corner: FloatingCorner;
}

interface MusicActions {
  /** Plays `queue` from `index`, shuffling the rest when shuffle is on. */
  playQueue: (queue: MusicTrack[], index: number) => void;
  /** Plays the queue's track at `index`. */
  playAt: (index: number) => void;
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
  /** Off, then the queue, then the track, then off again. */
  cycleRepeat: () => void;
  toggleShuffle: () => void;
}

const idle = {
  queue: [] as MusicTrack[],
  unshuffled: undefined,
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

const storedVolume = new StoredValue<number>(STORAGE_KEYS.musicVolume);
let saveVolume = 0;

const storedModes = new StoredValue<{ repeat: RepeatMode; shuffle: boolean }>(
  STORAGE_KEYS.musicModes,
);
const saveModes = () => {
  const { repeat, shuffle } = useMusic.getState();
  void storedModes.set({ repeat, shuffle });
};

/** `tracks` in a random order (Fisher–Yates). */
const shuffled = (tracks: MusicTrack[]) => {
  const result = [...tracks];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
};

/** `queue` with its `index`th track first and the rest shuffled. */
const shuffleFrom = (queue: MusicTrack[], index: number) => {
  const first = queue[index];
  if (!first) return queue;
  return [first, ...shuffled(queue.filter((_, i) => i !== index))];
};

/** Repeating one track, the browser loops it, with no `ended` in between. */
const applyLoop = (el: HTMLAudioElement | undefined) => {
  if (el) el.loop = useMusic.getState().repeat === 'one';
};

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
  applyLoop(next);
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
  if (next.ended) trackEnded();
};

/** What follows a track that played to its end. */
const trackEnded = () => {
  const music = useMusic.getState();
  if (music.repeat === 'one') {
    music.seek(0);
    music.play();
  } else if (music.index < music.queue.length - 1 || music.repeat === 'all') {
    music.next();
  } else {
    useMusic.setState({ playing: false });
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
    if (!twin) trackEnded();
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
  applyLoop(element);
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
  repeat: 'off',
  shuffle: false,
  corner: 'bottom-right',

  playQueue: (queue, index) => {
    if (!queue[index]) return;
    const current = currentTrack(get());
    if (get().shuffle) {
      set({ queue: shuffleFrom(queue, index), unshuffled: queue, index: 0 });
    } else {
      set({ queue, unshuffled: undefined, index });
    }
    startTrack(current);
  },
  playAt: (index) => {
    if (!get().queue[index]) return;
    const current = currentTrack(get());
    set({ index });
    startTrack(current);
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
    const { queue, index, repeat } = get();
    // Past the last track, repeating the queue starts it over.
    const target =
      index < queue.length - 1 ? index + 1 : repeat === 'all' ? 0 : undefined;
    if (target === undefined) return;
    if (target === index) {
      get().seek(0);
      return get().play();
    }
    set({ index: target });
    load(queue[target]!);
  },
  previous: () => {
    const { queue, index, currentTime, repeat } = get();
    const target =
      index > 0 ? index - 1 : repeat === 'all' ? queue.length - 1 : undefined;
    if (
      target === undefined ||
      target === index ||
      currentTime > RESTART_AFTER_S
    ) {
      return get().seek(0);
    }
    set({ index: target });
    load(queue[target]!);
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
  cycleRepeat: () => {
    const next = (REPEAT_MODES.indexOf(get().repeat) + 1) % REPEAT_MODES.length;
    set({ repeat: REPEAT_MODES[next]! });
    applyLoop(element);
    saveModes();
  },
  toggleShuffle: () => {
    const { queue, index, unshuffled, shuffle } = get();
    if (shuffle) {
      // Back to the given order, at the track that plays.
      const key = queue[index]?.key;
      const original = unshuffled ?? queue;
      set({
        shuffle: false,
        queue: original,
        unshuffled: undefined,
        index: Math.max(
          0,
          original.findIndex((track) => track.key === key),
        ),
      });
    } else {
      set({
        shuffle: true,
        queue: shuffleFrom(queue, index),
        unshuffled: queue,
        index: 0,
      });
    }
    saveModes();
  },
}));

void storedVolume.get().then((volume) => {
  if (volume !== undefined) useMusic.setState({ volume });
  applyVolume();
});

void storedModes.get().then((modes) => {
  if (!modes) return;
  // Anything another version stored otherwise stays as it is.
  useMusic.setState({
    ...(REPEAT_MODES.includes(modes.repeat) && { repeat: modes.repeat }),
    ...(typeof modes.shuffle === 'boolean' && { shuffle: modes.shuffle }),
  });
  applyLoop(element);
});

export const currentTrack = ({ queue, index }: MusicState) => queue[index];

/**
 * Plays the queue's current track, which was `previous` until now: loaded
 * afresh if it's another, or resumed (from its start once ended) if not.
 */
const startTrack = (previous: MusicTrack | undefined) => {
  const music = useMusic.getState();
  const track = currentTrack(music);
  if (!track) return;
  if (previous?.key !== track.key || music.failed) return load(track);
  if (element?.ended) music.seek(0);
  music.play();
};

export const musicCorner: CornerStore = {
  get: () => useMusic.getState().corner,
  set: (corner) => useMusic.setState({ corner }),
};

export const trackLabel = (track: MusicTrack) =>
  `${OST_LABEL[track.type]} ${track.index}`;

const artwork = (src: string | null | undefined) => (src ? [{ src }] : []);

/** The playing track's cover, once the player has found it. */
export const setMediaArtwork = (src: string | undefined) => {
  try {
    const { metadata } = navigator.mediaSession;
    if (metadata && metadata.artwork[0]?.src !== src) {
      metadata.artwork = artwork(src);
    }
  } catch {
    // As for the rest of the session's metadata.
  }
};

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
      artwork: artwork(track.release?.cover ?? track.poster),
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
