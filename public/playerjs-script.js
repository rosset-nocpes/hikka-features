window.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'playerjs-command' && event.data.api) {
    const command = event.data.api;
    const parameter =
      event.data.set !== undefined
        ? event.data.set
        : event.data.param || undefined;

    const result = player.api(command, parameter);

    const getters = [
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

    // if (getters.includes(command)) {
    //   window.top.postMessage(
    //     {
    //       event: 'playerjs-response',
    //       command: command,
    //       data: result,
    //     },
    //     '*',
    //   );
    // }
  }
});

function PlayerjsEvents(event, id, info) {
  let message = {
    event: event,
    player_id: id,
  };

  switch (event) {
    case 'play':
      // Map 'play' to 'playing: true' as per your initial logic
      message.event = 'playing';
      message.state = true;
      break;

    case 'pause':
      // Map 'pause' to 'playing: false'
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
