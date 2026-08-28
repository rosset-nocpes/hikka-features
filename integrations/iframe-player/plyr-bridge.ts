import type { IFramePlayerBridgeCommand } from './protocol';

import { IFramePlayerBridge } from './bridge';

const PLYR_HOSTS = ['moonanime.art'];

class PlyrQualityController {
  constructor(private readonly video: HTMLVideoElement) {}

  getOptions() {
    const select = this.getSelect();
    if (select) {
      return Array.from(select.options).map((option) => this.getLabel(option));
    }

    return this.getButtons().map((button) => this.getLabel(button));
  }

  getCurrent() {
    const select = this.getSelect();
    if (select) {
      return (
        select.selectedOptions[0]?.textContent?.trim() || select.value || ''
      );
    }

    const selectedButton = this.getButtons().find(
      (button) => button.ariaChecked === 'true',
    );
    if (selectedButton) {
      return this.getLabel(selectedButton);
    }

    const currentSource = Array.from(
      this.video.querySelectorAll<HTMLSourceElement>('source[size]'),
    ).find((source) => source.src === this.video.currentSrc);
    const currentSize = currentSource?.getAttribute('size');
    return currentSize ? `${currentSize}p` : '';
  }

  select(value: string, index: number) {
    const select = this.getSelect();
    if (select) {
      const option = this.findControl(Array.from(select.options), value, index);
      if (option) {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return this.getLabel(option);
      }
    }

    const button = this.findControl(this.getButtons(), value, index);
    if (!button) return null;

    button.click();
    return this.getLabel(button);
  }

  private getSelect() {
    return document.querySelector<HTMLSelectElement>(
      'select[data-plyr="quality"]',
    );
  }

  private getButtons() {
    return Array.from(
      document.querySelectorAll<HTMLButtonElement>(
        'button[data-plyr="quality"][value]',
      ),
    );
  }

  private findControl<T extends HTMLOptionElement | HTMLButtonElement>(
    controls: T[],
    value: string,
    index: number,
  ) {
    return (
      controls.find(
        (control) =>
          control.value === value || this.getLabel(control) === value,
      ) ?? controls[index]
    );
  }

  private getLabel(control: HTMLOptionElement | HTMLButtonElement) {
    return control.textContent?.trim() || control.value;
  }
}

export class PlyrBridge extends IFramePlayerBridge {
  static readonly matches = PLYR_HOSTS.map((host) => `https://${host}/*`);

  static readonly styles = `
    .ma-player-wrap > :not(.plyr):not(video),
    body > .ma-promo,
    .plyr__controls,
    .plyr__control--overlaid {
      display: none !important;
    }
  `;

  static supports(url: URL) {
    return PLYR_HOSTS.includes(url.hostname);
  }

  private readonly qualityController = new PlyrQualityController(this.video);

  protected onStart() {
    this.listen(this.video, 'play', () => this.postEvent('play'));
    this.listen(this.video, 'pause', () => this.postEvent('pause'));
    this.listen(this.video, 'ended', () => this.postEvent('end'));
    this.listen(this.video, 'timeupdate', () => {
      this.postEvent('time', this.video.currentTime);
    });
    this.listen(this.video, 'durationchange', () => {
      this.postEvent('duration', this.video.duration);
    });
    this.listen(this.video, 'volumechange', () => {
      this.postEvent(this.video.muted ? 'mute' : 'unmute');
      this.postEvent('volume', this.video.volume);
    });
    this.listen(this.video, 'ratechange', () => {
      this.postEvent('speed', this.video.playbackRate);
    });
    this.listen(this.video, 'waiting', () => this.postEvent('buffering'));
    this.listen(this.video, 'stalled', () => this.postEvent('buffering'));

    const postBufferedTime = () => {
      this.postEvent('buffered', undefined, this.getBufferedTime());
    };
    this.listen(this.video, 'playing', postBufferedTime);
    this.listen(this.video, 'canplay', postBufferedTime);
    this.listen(this.video, 'progress', postBufferedTime);

    if (this.video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      this.postInitialState();
    } else {
      this.listen(this.video, 'loadedmetadata', () => this.postInitialState(), {
        once: true,
      });
    }
  }

  protected handleCommand(command: IFramePlayerBridgeCommand) {
    switch (command.action) {
      case 'play':
        this.video.play().catch(() => {});
        break;
      case 'pause':
        this.video.pause();
        break;
      case 'seek':
        this.seek(command.value);
        break;
      case 'mute':
        this.video.muted = true;
        break;
      case 'unmute':
        this.video.muted = false;
        break;
      case 'set-volume':
        this.setVolume(command.value);
        break;
      case 'get-volume':
        this.postEvent('volume', this.video.volume);
        break;
      case 'set-speed':
        this.setSpeed(command.value);
        break;
      case 'set-quality':
        this.setQuality(command.value, command.index);
        break;
      case 'get-quality':
        this.postEvent('quality', this.qualityController.getCurrent());
        break;
      case 'get-qualities':
        this.postEvent(
          'qualities',
          undefined,
          this.qualityController.getOptions(),
        );
        break;
      case 'set-subtitle':
        this.setSubtitle(command.value, command.index);
        break;
      case 'get-subtitles':
        this.postEvent(
          'subtitles',
          undefined,
          this.getSubtitleTracks().map((track) => this.getSubtitleLabel(track)),
        );
        break;
      case 'get-buffered':
        this.postEvent('buffered', undefined, this.getBufferedTime());
        break;
    }
  }

  private postInitialState() {
    this.postEvent('inited');
    this.postEvent('duration', this.video.duration);
    this.postEvent('time', this.video.currentTime);
    this.postEvent(this.video.paused ? 'pause' : 'play');
    this.postEvent(this.video.muted ? 'mute' : 'unmute');
    this.postEvent('speed', this.video.playbackRate);
    this.postEvent('start');
  }

  private seek(time: number) {
    if (Number.isFinite(time)) {
      this.video.currentTime = time;
    }
  }

  private setVolume(volume: number) {
    if (Number.isFinite(volume)) {
      this.video.volume = Math.min(Math.max(volume, 0), 1);
    }
  }

  private setSpeed(speed: number) {
    if (Number.isFinite(speed) && speed > 0) {
      this.video.playbackRate = speed;
    }
  }

  private setQuality(value: string, index: number) {
    const quality = this.qualityController.select(value, index);
    if (quality) {
      this.postEvent('quality', quality);
    }
  }

  private getBufferedTime() {
    for (let index = 0; index < this.video.buffered.length; index += 1) {
      if (
        this.video.currentTime >= this.video.buffered.start(index) &&
        this.video.currentTime <= this.video.buffered.end(index)
      ) {
        return this.video.buffered.end(index);
      }
    }

    return this.video.buffered.length
      ? this.video.buffered.end(this.video.buffered.length - 1)
      : 0;
  }

  private getSubtitleTracks() {
    return Array.from(this.video.textTracks).filter(
      (track) => track.kind === 'captions' || track.kind === 'subtitles',
    );
  }

  private getSubtitleLabel(track: TextTrack) {
    return track.label || track.language;
  }

  private setSubtitle(value: string, index: number) {
    const tracks = this.getSubtitleTracks();
    const selectedTrack = value
      ? tracks.find((track) => this.getSubtitleLabel(track) === value)
      : tracks[index];

    tracks.forEach((track) => {
      track.mode = track === selectedTrack ? 'showing' : 'disabled';
    });
    this.postEvent(
      'subtitle',
      selectedTrack ? this.getSubtitleLabel(selectedTrack) : '',
    );
  }
}
