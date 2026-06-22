const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
const GETTERS = [
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
];

let lastEndEvent = 0;

function getVideo() {
  return document.querySelector('video');
}

const POSTER_KEYWORDS = ['poster', 'thumb', 'start', 'screen', 'bg', 'cover'];

function hidePoster() {
  const toHide = [];
  const pjsdivs = document.querySelectorAll('pjsdiv');

  for (let i = 0; i < pjsdivs.length; i++) {
    const el = pjsdivs[i];
    const cls = el.classList.toString();
    if (cls.indexOf('subtitles') !== -1) continue;

    const hasKeyword = POSTER_KEYWORDS.some(function (kw) {
      return cls.indexOf(kw) !== -1;
    });

    if (hasKeyword) {
      toHide.push(el);
    } else {
      const bg = el.style.backgroundImage;
      if (bg && bg !== 'none' && bg.indexOf('url') !== -1) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 100 && rect.height > 100) toHide.push(el);
      }
    }
  }

  const video = getVideo();
  if (video) {
    video.removeAttribute('poster');
    video.poster = '';
  }
  for (let j = 0; j < toHide.length; j++) {
    toHide[j].style.display = 'none';
  }
}

function applyVideoCommand(video, command, parameter) {
  if (!video) return false;
  switch (command) {
    case 'play':
      try {
        player.api('play');
      } catch {}
      video.play().catch(function () {});
      hidePoster();
      return true;
    case 'pause':
      try {
        player.api('pause');
      } catch {}
      video.pause();
      return true;
    case 'seek':
      video.currentTime = Number(parameter);
      return true;
    case 'mute':
      video.muted = true;
      return true;
    case 'unmute':
      video.muted = false;
      return true;
    case 'volume':
      video.volume = Math.max(0, Math.min(1, Number(parameter)));
      return true;
  }
  return false;
}

window.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'playerjs-command' && event.data.api) {
    const command = event.data.api;
    const parameter =
      event.data.set !== undefined
        ? event.data.set
        : event.data.param || undefined;

    const video = getVideo();
    let result;

    if (!applyVideoCommand(video, command, parameter)) {
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

    if (GETTERS.includes(command)) {
      window.top.postMessage(
        { type: 'playerjs-response', command: command, data: result },
        '*',
      );
    }
  }
});

function PlayerjsEvents(event, id, info) {
  const message = { event: event, player_id: id };

  switch (event) {
    case 'play':
      message.event = 'playing';
      message.state = true;
      break;
    case 'pause':
      message.event = 'playing';
      message.state = false;
      break;
    case 'mute':
      message.event = 'muted';
      message.state = true;
      break;
    case 'unmute':
      message.event = 'muted';
      message.state = false;
      break;
    case 'ui':
      message.data = Number(info);
      break;
    case 'time':
    case 'duration':
    case 'seek':
    case 'userseek':
    case 'volume':
    case 'quality':
    case 'audiotrack':
    case 'subtitle':
    case 'speed':
    case 'height':
    case 'loaderror':
    case 'error':
    case 'fragment':
    case 'quartile':
    case 'resize':
      message.data = info;
      break;
    default:
      if (info !== undefined && info !== null && info !== '') {
        message.data = info;
      }
      break;
  }

  window.top.postMessage({ type: 'playerjs-event', ...message }, '*');
}

function forwardEvent(eventName, info) {
  if (eventName === 'end') {
    const now = Date.now();
    if (now - lastEndEvent < 1000) return;
    lastEndEvent = now;
  }
  PlayerjsEvents(eventName, '', info);
}

function isVideo(e) {
  return e.target && e.target.tagName === 'VIDEO';
}

const VIDEO_EVENT_HANDLERS = {
  play: function (e) {
    forwardEvent('play');
    hidePoster();
    e.stopPropagation();
  },
  pause: function (_e) {
    forwardEvent('pause');
  },
  playing: function () {
    forwardEvent('buffered');
    hidePoster();
  },
  waiting: function () {
    forwardEvent('buffering');
  },
  timeupdate: function (e) {
    forwardEvent('time', e.target.currentTime);
  },
  seeked: function (e) {
    forwardEvent('time', e.target.currentTime);
  },
  durationchange: function (e) {
    if (isFinite(e.target.duration))
      forwardEvent('duration', e.target.duration);
  },
  loadedmetadata: function (e) {
    if (isFinite(e.target.duration))
      forwardEvent('duration', e.target.duration);
  },
  loadeddata: function () {
    forwardEvent('start');
  },
  ended: function () {
    forwardEvent('end');
  },
  volumechange: function (e) {
    forwardEvent('volume', e.target.volume);
    forwardEvent(e.target.muted ? 'mute' : 'unmute');
  },
  ratechange: function (e) {
    forwardEvent('speed', e.target.playbackRate);
  },
};

Object.keys(VIDEO_EVENT_HANDLERS).forEach(function (name) {
  document.addEventListener(
    name,
    function (e) {
      if (isVideo(e)) VIDEO_EVENT_HANDLERS[name](e);
    },
    true,
  );
});

function initVideoState(video) {
  if (!video || video.dataset.hikkaInit) return;
  video.dataset.hikkaInit = '1';

  if (isFinite(video.duration) && video.duration > 0) {
    forwardEvent('duration', video.duration);
  }
  if (video.readyState >= 2) forwardEvent('start');
  if (!video.paused && !video.ended) forwardEvent('play');
  if (video.currentTime > 0) forwardEvent('time', video.currentTime);
  forwardEvent('volume', video.volume);
  forwardEvent(video.muted ? 'mute' : 'unmute');
  forwardEvent('speed', video.playbackRate);
}

const existingVideo = getVideo();
if (existingVideo) initVideoState(existingVideo);

let initAttempts = 0;
const initInterval = window.setInterval(function () {
  const video = getVideo();
  if (video) {
    window.clearInterval(initInterval);
    initVideoState(video);
  } else if (++initAttempts > 20) {
    window.clearInterval(initInterval);
  }
}, 500);
