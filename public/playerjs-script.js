const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

const GETTERS = new Set([
  'isfullscreen',
  'playing',
  'started',
  'time',
  'duration',
  'buffered',
  'muted',
  'volume',
  'quality',
  'qualities',
  'audiotrack',
  'audiotracks',
  'speed',
  'id',
  'log',
  'screenshot',
  'subtitles',
  'title',
  'playlist',
  'playlist_id',
  'playlist_title',
  'playlist_folders',
  'playlist_length',
  'autonext',
  'playlistloop',
  'loop',
  'ratio',
  'native',
  'visibility',
  'hlserror',
  'dasherror',
  'hls',
  'dash',
  'adblock',
  'live',
  'size',
  'stretch',
  'geo',
  'act',
  'vars',
]);

const POSTER_KEYWORDS = ['poster', 'thumb', 'start', 'screen', 'bg', 'cover'];

const EVENT_ALIASES = {
  play: { event: 'playing', state: true },
  pause: { event: 'playing', state: false },
  mute: { event: 'muted', state: true },
  unmute: { event: 'muted', state: false },
};

const DATA_EVENTS = new Set([
  'time',
  'duration',
  'seek',
  'userseek',
  'volume',
  'quality',
  'audiotrack',
  'subtitle',
  'speed',
  'height',
  'loaderror',
  'error',
  'fragment',
  'quartile',
  'resize',
]);

let lastEndEvent = 0;

const getVideo = () => document.querySelector('video');

function isPosterElement(el) {
  const cls = el.classList.toString();
  if (cls.includes('subtitles')) return false;
  if (POSTER_KEYWORDS.some((kw) => cls.includes(kw))) return true;
  const bg = el.style.backgroundImage;
  if (!bg || bg === 'none' || !bg.includes('url')) return false;
  const { width, height } = el.getBoundingClientRect();
  return width > 100 && height > 100;
}

function hidePoster() {
  const video = getVideo();
  if (video) {
    video.removeAttribute('poster');
    video.poster = '';
  }
  document.querySelectorAll('pjsdiv').forEach((el) => {
    if (isPosterElement(el)) el.style.display = 'none';
  });
}

const VIDEO_COMMANDS = {
  play(video) {
    try {
      player.api('play');
    } catch {}
    video.play().catch(() => {});
    hidePoster();
  },
  pause(video) {
    try {
      player.api('pause');
    } catch {}
    video.pause();
  },
  seek: (video, p) => {
    video.currentTime = Number(p);
  },
  mute: (video) => {
    video.muted = true;
  },
  unmute: (video) => {
    video.muted = false;
  },
  volume: (video, p) => {
    video.volume = Math.max(0, Math.min(1, Number(p)));
  },
};

window.addEventListener('message', ({ data }) => {
  if (data?.type !== 'playerjs-command' || !data.api) return;

  const command = data.api;
  const parameter = data.set !== undefined ? data.set : data.param || undefined;
  const video = getVideo();
  let result;

  if (video && VIDEO_COMMANDS[command]) {
    VIDEO_COMMANDS[command](video, parameter);
  } else {
    try {
      result = player.api(command, parameter);
    } catch {
      if (video && command === 'speed') {
        const idx = parseInt(parameter);
        if (idx >= 0 && idx < SPEED_OPTIONS.length) {
          video.playbackRate = SPEED_OPTIONS[idx];
          result = SPEED_OPTIONS[idx];
        }
      }
    }
  }

  if (GETTERS.has(command)) {
    window.top.postMessage(
      { type: 'playerjs-response', command, data: result },
      '*',
    );
  }
});

function postEvent(event, playerId, info) {
  const alias = EVENT_ALIASES[event];
  const msg = alias
    ? { event: alias.event, player_id: playerId, state: alias.state }
    : { event, player_id: playerId };

  if (!alias) {
    if (event === 'ui') msg.data = Number(info);
    else if (DATA_EVENTS.has(event) || (info != null && info !== ''))
      msg.data = info;
  }

  window.top.postMessage({ type: 'playerjs-event', ...msg }, '*');
}

function forwardEvent(event, info) {
  if (event === 'end') {
    const now = Date.now();
    if (now - lastEndEvent < 1000) return;
    lastEndEvent = now;
  }
  postEvent(event, '', info);
}

const onDuration = (e) =>
  isFinite(e.target.duration) && forwardEvent('duration', e.target.duration);

const VIDEO_EVENT_HANDLERS = {
  play(e) {
    forwardEvent('play');
    hidePoster();
    e.stopPropagation();
  },
  pause: () => forwardEvent('pause'),
  playing: () => {
    forwardEvent('buffered');
    hidePoster();
  },
  waiting: () => forwardEvent('buffering'),
  timeupdate: (e) => forwardEvent('time', e.target.currentTime),
  seeked: (e) => forwardEvent('time', e.target.currentTime),
  durationchange: onDuration,
  loadedmetadata: onDuration,
  loadeddata: () => forwardEvent('start'),
  ended: () => forwardEvent('end'),
  volumechange(e) {
    forwardEvent('volume', e.target.volume);
    forwardEvent(e.target.muted ? 'mute' : 'unmute');
  },
  ratechange: (e) => forwardEvent('speed', e.target.playbackRate),
};

Object.entries(VIDEO_EVENT_HANDLERS).forEach(([name, handler]) => {
  document.addEventListener(
    name,
    (e) => {
      if (e.target?.tagName === 'VIDEO') handler(e);
    },
    true,
  );
});

function initVideoState(video) {
  if (!video || video.dataset.hikkaInit) return;
  video.dataset.hikkaInit = '1';

  if (isFinite(video.duration) && video.duration > 0)
    forwardEvent('duration', video.duration);
  if (video.readyState >= 2) forwardEvent('start');
  if (!video.paused && !video.ended) forwardEvent('play');
  if (video.currentTime > 0) forwardEvent('time', video.currentTime);
  forwardEvent('volume', video.volume);
  forwardEvent(video.muted ? 'mute' : 'unmute');
  forwardEvent('speed', video.playbackRate);
}

{
  const initial = getVideo();
  if (initial) {
    initVideoState(initial);
  } else {
    let attempts = 0;
    const poll = setInterval(() => {
      const v = getVideo();
      if (v || ++attempts > 20) {
        clearInterval(poll);
        if (v) initVideoState(v);
      }
    }, 500);
  }
}
