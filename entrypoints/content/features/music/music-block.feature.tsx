import type { FC } from 'react';

import { useEffect, useState } from 'react';
import MaterialSymbolsMusicNoteRounded from '~icons/material-symbols/music-note-rounded';
import MaterialSymbolsMusicOffRounded from '~icons/material-symbols/music-off-rounded';
import MaterialSymbolsPauseRounded from '~icons/material-symbols/pause-rounded';
import MaterialSymbolsPlayArrowRounded from '~icons/material-symbols/play-arrow-rounded';
import MaterialSymbolsShuffleRounded from '~icons/material-symbols/shuffle-rounded';

import type { HikkaOst } from '@/hooks/use-hikka';

import { FadeImage } from '@/components/fade-image';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Hint } from '@/components/ui/tooltip';
import { onHikkaLinkClick } from '@/utils/hikka-router';
import { plural } from '@/utils/plural';

import { BaseFeature } from '../../core/base-feature';
import { HikkaPages } from '../../core/core.enums';
import {
  isPlayable,
  type MusicTrack,
  OST_LABEL,
  performerOf,
  type Song,
  useAnimeMusic,
} from './animethemes';
import Equalizer from './equalizer';
import LikeButton from './like-button';
import { playMusic } from './music-player';
import { TRACK_FORMS } from './music.constants';
import SongLink from './song-link';
import { currentTrack, useMusic } from './use-music';
import { fillFavoriteAudio, useFavoriteSongs } from './use-music-favorites';
import {
  findRelease,
  type SongRelease,
  useSongReleases,
} from './use-song-releases';

/** Tracks the anime's page shows; its media page shows them all. */
const SHOWN = 6;

const findMedia = () =>
  document.querySelector<HTMLElement>('#content-media') ?? undefined;

const isMediaPage = () => location.pathname.endsWith('/media');

/** The cover of one of hikka.io's music cards: an icon, where videos have a thumbnail. */
const OST_COVER = '> div > [data-slot="aspect-ratio"] > * > svg';

/**
 * The block sits in hikka.io's media block from the start, hidden, and these
 * rules swap it for the site's music cards in the same frame the "Музика"
 * tab renders them: mounting it only then showed the site's cards first.
 */
const SWAP_STYLE = `
#content-media:has(> music-block) > div:has(${OST_COVER}):not(:has(img)),
#content-media:not(:has(> div ${OST_COVER})) > music-block,
#content-media:has(> div > div > [data-slot="aspect-ratio"] img) > music-block {
  display: none !important;
}`;

const keyOf = (slug: string, ost: HikkaOst) =>
  `${slug}:${ost.ost_type}:${ost.index}:${ost.title}`;

/**
 * hikka.io's music tab as a track list: every opening and ending to like,
 * with what AnimeThemes can play ready to play and queue.
 */
export default class MusicBlockFeature extends BaseFeature {
  readonly id = 'music-block';
  readonly pages = [HikkaPages.AnimeContent];
  /** The page it was rendered for: the media page shows every track. */
  private path?: string;

  async init() {
    const { ctx } = usePageStore.getState();
    const style = document.createElement('style');
    style.textContent = SWAP_STYLE;
    document.head.append(style);
    ctx.onInvalidated(() => style.remove());

    this.ui = await this.createUi({
      position: 'inline',
      anchor: findMedia,
      append: 'last',
      render: (container) => <MusicBlock container={container} />,
    });
  }

  override get shouldMount(): boolean {
    return (
      super.shouldMount &&
      useSettings.getState().features.musicPlayer.enabled &&
      !!findMedia()
    );
  }

  override get isMounted(): boolean {
    const host = this.ui?.shadowHost;
    if (!this.ui?.mounted || !host?.isConnected) return false;
    return (
      !this.shouldMount ||
      (host.parentElement === findMedia() && this.path === location.pathname)
    );
  }

  override mount() {
    if (!this.ui) return;
    // Its host may be left in the page's previous media block.
    this.unmount();
    this.path = location.pathname;
    this.ui.mount();
  }

  override unmount() {
    if (this.ui?.mounted) this.ui.remove();
  }
}

/** Whether `element` has been on screen: until then, nothing is fetched. */
const useShown = (element: HTMLElement) => {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (shown) return;
    const observer = new ResizeObserver(() => {
      if (element.checkVisibility()) setShown(true);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, shown]);
  return shown;
};

const MusicBlock: FC<{ container: HTMLElement }> = ({ container }) => {
  const { slug } = usePageStore();
  const { data: anime } = useHikka();
  // Hidden behind the "Відео" tab, it doesn't look anything up yet.
  const visible = useShown(container);
  const songs = useAnimeMusic(visible ? anime : undefined, slug);
  const tracks = songs?.filter(isPlayable);
  const releases = useSongReleases(
    visible && anime?.ost?.length ? slug : undefined,
  );
  const favorites = useFavoriteSongs()?.data;
  const extended = isMediaPage();

  useEffect(() => {
    if (favorites && tracks?.length) fillFavoriteAudio(favorites, tracks);
  }, [favorites, tracks]);

  const ost = anime?.ost ?? [];
  if (!slug || ost.length === 0) return null;

  const byKey = new Map(songs?.map((song) => [song.key, song]));
  const rows = ost.map((item) => ({
    ost: item,
    song: byKey.get(keyOf(slug, item)),
  }));
  const shown = extended ? rows : rows.slice(0, SHOWN);
  const hidden = rows.length - shown.length;

  return (
    <div className="flex flex-col gap-3">
      <Toolbar tracks={tracks} total={ost.length} />
      <ol className="-mx-2 grid gap-x-4 md:grid-cols-2">
        {shown.map(({ ost: item, song }, index) => (
          <TrackRow
            key={keyOf(slug, item) + index}
            ost={item}
            song={song}
            release={findRelease(releases, {
              type: item.ost_type,
              index: item.index,
            })}
            queue={tracks}
          />
        ))}
      </ol>
      {hidden > 0 && (
        <a
          href={`/anime/${slug}/media`}
          onClick={onHikkaLinkClick}
          className="text-muted-foreground hover:text-foreground w-fit text-sm font-medium underline-offset-4 hover:underline"
        >
          Ще {hidden} {plural(hidden, TRACK_FORMS)}
        </a>
      )}
    </div>
  );
};

/** Plays the anime's music from the start, in order or shuffled. */
const Toolbar: FC<{ tracks?: MusicTrack[]; total: number }> = ({
  tracks,
  total,
}) => {
  const slug = tracks?.[0]?.slug;
  const isThisAnime = useMusic(
    (state) => !!slug && currentTrack(state)?.slug === slug,
  );
  const playing = useMusic((state) => state.playing) && isThisAnime;
  const playable = tracks?.length ?? 0;

  const playAll = (shuffle: boolean) => {
    if (!tracks?.length) return;
    const music = useMusic.getState();
    if (music.shuffle !== shuffle) music.toggleShuffle();
    playMusic(tracks, shuffle ? Math.floor(Math.random() * tracks.length) : 0);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        className="gap-1.5 pr-3"
        disabled={!playable}
        onClick={() =>
          isThisAnime ? useMusic.getState().toggle() : playAll(false)
        }
      >
        {playing ? (
          <MaterialSymbolsPauseRounded className="size-5" />
        ) : (
          <MaterialSymbolsPlayArrowRounded className="size-5" />
        )}
        {playing ? 'Пауза' : isThisAnime ? 'Продовжити' : 'Слухати'}
      </Button>
      {playable > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground gap-1.5 pr-3"
          onClick={() => playAll(true)}
        >
          <MaterialSymbolsShuffleRounded className="size-5" />
          Перемішати
        </Button>
      )}
      <span className="text-muted-foreground ml-auto text-xs">
        {!tracks ? (
          <Spinner className="size-4" aria-label="Шукаємо аудіо" />
        ) : playable < total ? (
          `${playable} з ${total} можна послухати`
        ) : (
          `${total} ${plural(total, TRACK_FORMS)}`
        )}
      </span>
    </div>
  );
};

interface RowProps {
  ost: HikkaOst;
  /** The song, once AnimeThemes has answered; it plays if it has audio. */
  song?: Song;
  /** Its cover and album, once the backend has found them. */
  release?: SongRelease;
  /** The anime's playable tracks, queued when one is played. */
  queue?: MusicTrack[];
}

const TrackRow: FC<RowProps> = ({ ost, song, release, queue }) => {
  const loading = !song;
  const track = song && isPlayable(song) ? song : undefined;
  const isCurrent = useMusic(
    (state) => !!track && currentTrack(state)?.key === track.key,
  );
  const playing = useMusic((state) => state.playing) && isCurrent;
  const label = `${OST_LABEL[ost.ost_type]} ${ost.index}`;
  const unavailable = !track && !loading;
  const cover = release?.cover;

  const play = () => {
    if (!track || !queue) return;
    if (isCurrent) useMusic.getState().toggle();
    else playMusic(queue, queue.indexOf(track));
  };

  return (
    <li
      data-current={isCurrent}
      data-unavailable={unavailable}
      className="group/row hover:bg-secondary/40 data-[current=true]:bg-secondary/40 flex min-w-0 items-center gap-1 rounded-md pr-1 transition-colors"
    >
      <Hint label={unavailable ? 'AnimeThemes не має цього треку' : undefined}>
        <button
          type="button"
          disabled={!track}
          aria-label={
            track
              ? playing
                ? `Призупинити «${ost.title}»`
                : `Слухати «${ost.title}»`
              : undefined
          }
          className="group/play focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-3 rounded-md p-2 text-left outline-none focus-visible:ring-2 disabled:cursor-default"
          onClick={play}
        >
          <span
            className={cn(
              'relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md',
              cover
                ? 'bg-muted text-white'
                : cn(
                    'bg-secondary/60 text-muted-foreground',
                    isCurrent && 'bg-primary/15 text-primary',
                  ),
            )}
          >
            {cover && (
              <>
                {/* Dimmed around it: its own opacity is the fade's. */}
                <span
                  className={cn(
                    'absolute inset-0',
                    unavailable && 'opacity-50 grayscale',
                  )}
                >
                  <FadeImage src={cover} />
                </span>
                {/* Under the icons, which a cover alone would swallow. */}
                <span
                  className={cn(
                    'absolute inset-0 bg-black/45 opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-visible/play:opacity-100',
                    (loading || isCurrent) && 'opacity-100',
                    unavailable &&
                      'group-hover/row:opacity-0 group-focus-visible/play:opacity-0',
                  )}
                />
              </>
            )}
            <span className="relative flex">
              {loading ? (
                <Spinner className="size-4" />
              ) : !track ? (
                !cover && (
                  <MaterialSymbolsMusicOffRounded className="size-5 opacity-60" />
                )
              ) : playing ? (
                <>
                  <Equalizer
                    playing
                    className="group-hover/row:hidden group-focus-visible/play:hidden"
                  />
                  <MaterialSymbolsPauseRounded className="hidden size-6 group-hover/row:block group-focus-visible/play:block" />
                </>
              ) : (
                <>
                  {isCurrent ? (
                    <Equalizer
                      playing={false}
                      className="group-hover/row:hidden group-focus-visible/play:hidden"
                    />
                  ) : (
                    !cover && (
                      <MaterialSymbolsMusicNoteRounded className="size-5 group-hover/row:hidden group-focus-visible/play:hidden" />
                    )
                  )}
                  <MaterialSymbolsPlayArrowRounded
                    className={cn(
                      'hidden size-6 group-hover/row:block group-focus-visible/play:block',
                      !cover && 'text-foreground',
                    )}
                  />
                </>
              )}
            </span>
          </span>
          <span className="grid min-w-0 flex-1 gap-0.5">
            <span
              className={cn(
                'truncate text-sm leading-5 font-medium',
                isCurrent && 'text-primary',
                unavailable && 'text-muted-foreground',
              )}
            >
              {ost.title}
            </span>
            <span className="text-muted-foreground truncate text-xs leading-4">
              {[
                label,
                performerOf(song ?? ost, release),
                release?.released?.slice(0, 4),
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </span>
        </button>
      </Hint>
      <SongLink
        spotify={ost.spotify}
        release={release}
        className="text-muted-foreground"
      />
      {/* The backend keeps only songs Hikka numbers and names. */}
      {song && ost.index >= 1 && !!ost.title?.trim() && (
        <LikeButton
          song={song}
          release={release}
          className="text-muted-foreground"
        />
      )}
    </li>
  );
};
