import type { FC } from 'react';

import { motion } from 'motion/react';
import MaterialSymbolsMusicNoteRounded from '~icons/material-symbols/music-note-rounded';
import MaterialSymbolsMusicOffRounded from '~icons/material-symbols/music-off-rounded';
import MaterialSymbolsPauseRounded from '~icons/material-symbols/pause-rounded';
import MaterialSymbolsPlayArrowRounded from '~icons/material-symbols/play-arrow-rounded';
import MaterialSymbolsShuffleRounded from '~icons/material-symbols/shuffle-rounded';

import type { HikkaOst } from '@/hooks/use-hikka';

import { FadeImage } from '@/components/fade-image';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { onHikkaLinkClick } from '@/utils/hikka-router';
import { plural } from '@/utils/plural';

import { BaseFeature } from '../../core/base-feature';
import { HikkaPages } from '../../core/core.enums';
import { type MusicTrack, OST_LABEL, useAnimeMusic } from './animethemes';
import Equalizer from './equalizer';
import LikeButton from './like-button';
import { playMusic } from './music-player';
import { TRACK_FORMS } from './music.constants';
import SongLink from './song-link';
import { currentTrack, useMusic } from './use-music';
import {
  findRelease,
  type SongRelease,
  useSongReleases,
} from './use-song-releases';

/** Set on hikka.io's own cards while the block stands in for them. */
const REPLACED = 'data-hikka-features-music-replaced';

/** Tracks the anime's page shows; its media page shows them all. */
const SHOWN = 6;

/**
 * The "Музика" tab's cards, on an anime's page and its media page. Unlike
 * the videos', their covers hold an icon, not an image.
 */
const findSiteCards = () => {
  const cover = Array.from(
    document.querySelectorAll<HTMLElement>(
      '#content-media [data-slot="aspect-ratio"]',
    ),
  ).find(
    (element) =>
      !element.querySelector('img') &&
      !!element.nextElementSibling?.querySelector('span'),
  );
  // Cover → card → hikka.io's grid of cards.
  return cover?.parentElement?.parentElement ?? undefined;
};

const isMediaPage = () => location.pathname.endsWith('/media');

const keyOf = (slug: string, ost: HikkaOst) =>
  `${slug}:${ost.ost_type}:${ost.index}:${ost.title}`;

/**
 * hikka.io's music tab as a track list: every opening and ending, with
 * what AnimeThemes can play ready to play, like and queue.
 */
export default class MusicBlockFeature extends BaseFeature {
  readonly id = 'music-block';
  readonly pages = [HikkaPages.AnimeContent];

  async init() {
    const { ctx } = usePageStore.getState();
    const style = document.createElement('style');
    style.textContent = `[${REPLACED}] { display: none !important; }`;
    document.head.append(style);
    ctx.onInvalidated(() => style.remove());

    this.ui = await this.createUi({
      position: 'inline',
      anchor: findSiteCards,
      append: 'before',
      render: () => <MusicBlock />,
    });
  }

  override get shouldMount(): boolean {
    return (
      super.shouldMount &&
      useSettings.getState().features.musicPlayer.enabled &&
      !!findSiteCards()
    );
  }

  override get isMounted(): boolean {
    const host = this.ui?.shadowHost;
    if (!this.ui?.mounted || !host?.isConnected) return false;
    const cards = findSiteCards();
    return (
      !this.shouldMount ||
      (host.nextElementSibling === cards && !!cards?.hasAttribute(REPLACED))
    );
  }

  override mount() {
    if (!this.ui) return;
    if (this.ui.mounted) this.unmount();
    const cards = findSiteCards();
    if (!cards) return;
    this.ui.mount();
    cards.setAttribute(REPLACED, '');
  }

  override unmount() {
    if (this.ui?.mounted) this.ui.remove();
    for (const cards of document.querySelectorAll(`[${REPLACED}]`)) {
      cards.removeAttribute(REPLACED);
    }
  }
}

const MusicBlock = () => {
  const { slug } = usePageStore();
  const { data: anime } = useHikka();
  const tracks = useAnimeMusic(anime, slug);
  const releases = useSongReleases(anime?.ost?.length ? slug : undefined);
  const extended = isMediaPage();

  const ost = anime?.ost ?? [];
  if (!slug || ost.length === 0) return null;

  const byKey = new Map(tracks?.map((track) => [track.key, track]));
  const rows = ost.map((item) => ({
    ost: item,
    track: byKey.get(keyOf(slug, item)),
  }));
  const shown = extended ? rows : rows.slice(0, SHOWN);
  const hidden = rows.length - shown.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-3"
    >
      <Toolbar tracks={tracks} total={ost.length} />
      <ol className="-mx-2 grid gap-x-4 md:grid-cols-2">
        {shown.map(({ ost: item, track }, index) => (
          <TrackRow
            key={keyOf(slug, item) + index}
            ost={item}
            track={track}
            release={findRelease(releases, {
              type: item.ost_type,
              index: item.index,
            })}
            loading={!tracks}
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
    </motion.div>
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
  /** What plays it; none when AnimeThemes has no audio for it. */
  track?: MusicTrack;
  /** Its cover and album, once the backend has found them. */
  release?: SongRelease;
  /** AnimeThemes hasn't answered yet. */
  loading: boolean;
  /** The anime's playable tracks, queued when one is played. */
  queue?: MusicTrack[];
}

const TrackRow: FC<RowProps> = ({ ost, track, release, loading, queue }) => {
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
        title={unavailable ? 'AnimeThemes не має цього треку' : undefined}
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
              track?.author ?? ost.author,
              release?.released?.slice(0, 4),
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </span>
      </button>
      <SongLink
        spotify={ost.spotify}
        release={release}
        className="text-muted-foreground"
      />
      {track && <LikeButton track={track} className="text-muted-foreground" />}
    </li>
  );
};
