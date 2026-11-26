import type { FC } from 'react';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { create } from 'zustand';
import MaterialSymbolsArrowRightAltRounded from '~icons/material-symbols/arrow-right-alt-rounded';
import MaterialSymbolsLibraryMusicRounded from '~icons/material-symbols/library-music-rounded';
import MaterialSymbolsPauseRounded from '~icons/material-symbols/pause-rounded';
import MaterialSymbolsPlayArrowRounded from '~icons/material-symbols/play-arrow-rounded';

import { FadeImage } from '@/components/fade-image';
import { Poster } from '@/components/hikka/poster';
import EmptyState from '@/components/ui/empty-state';
import { fetchHikka } from '@/hooks/use-hikka';
import { navigateOnHikka, onHikkaLinkClick } from '@/utils/hikka-router';
import { hikkaViewerQuery } from '@/utils/hikka-viewer';
import { plural } from '@/utils/plural';

import { AnchoredUisFeature } from '../../core/base-feature';
import { HikkaPages } from '../../core/core.enums';
import { OST_LABEL } from './animethemes';
import Equalizer from './equalizer';
import LikeButton from './like-button';
import { playMusic } from './music-player';
import { TRACK_FORMS } from './music.constants';
import { currentTrack, useMusic } from './use-music';
import {
  type FavoriteSong,
  favoriteTrack,
  useFavoriteSongs,
} from './use-music-favorites';

/** Set on hikka.io's favourites block while it shows the music. */
const SHOWING_MUSIC = 'data-hikka-features-music-tab';

/** The block's own tag, for keeping it out of the rule that hides the rest. */
const TAG = 'music-favorites';

/** Cards the profile shows; past that the last one opens the full list. */
const PREVIEW = 6;

/*
 * hikka.io's chip tabs, as its own classes, so the chip looks like its
 * neighbours: it sits among them, outside any shadow root.
 */
const CHIP =
  'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md font-medium transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring border px-3.5 text-sm';
const CHIP_ACTIVE =
  'border-primary-foreground/40 bg-primary-foreground/15 text-primary-foreground';
const CHIP_IDLE =
  'border-transparent bg-secondary/40 text-muted-foreground hover:bg-accent';

/*
 * While the music shows: hikka.io's own cards, empty state and "more"
 * button go, and its selected chip looks like the others.
 */
const STYLE = `
#user-favorites[${SHOWING_MUSIC}] > div:has([role="tablist"]) ~ :not(${TAG}) {
  display: none !important;
}
#user-favorites[${SHOWING_MUSIC}] [role="tablist"] > [role="tab"][aria-selected="true"] {
  border-color: transparent !important;
  color: var(--muted-foreground) !important;
}
#user-favorites[${SHOWING_MUSIC}] [role="tablist"] > [role="tab"][aria-selected="true"]:not(:hover) {
  background-color: color-mix(in oklab, var(--secondary) 40%, transparent) !important;
}`;

/**
 * Whose music the "Музика" chip shows. It stays chosen from the profile to
 * the full list and back, as long as it's the same user's.
 */
const useMusicTab = create<{ username?: string }>(() => ({}));

const profileUsername = () => {
  const match = /^\/u\/([^/]+)/.exec(location.pathname);
  return match ? decodeURIComponent(match[1]!) : undefined;
};

const isFullList = () => location.pathname.endsWith('/favorites');

const findBlock = () =>
  document.querySelector<HTMLElement>('#user-favorites') ?? undefined;

const findTabList = () =>
  findBlock()?.querySelector<HTMLElement>('[role="tablist"]') ?? undefined;

/** The tabs' own wrapper, the block's child the music goes after. */
const findTabs = () => {
  const block = findBlock();
  let tabs = findTabList();
  while (tabs && tabs.parentElement !== block)
    tabs = tabs.parentElement ?? undefined;
  return tabs;
};

/**
 * Where the profile's favourites would be, when Hikka shows none: hikka.io
 * leaves the block out for a visitor if every list is empty.
 */
const findEmptySlot = () => {
  if (isFullList()) return undefined;
  const slot = document.querySelector('#profile-left-side')?.children[1];
  return slot instanceof HTMLElement && !slot.querySelector('#user-favorites')
    ? slot
    : undefined;
};

/** The profile's user, and whether it's the one viewing it. */
function useProfileMusic() {
  const username = profileUsername();
  const { data: user } = useQuery({
    queryKey: ['hikka-user', username],
    queryFn: () => fetchHikka<{ reference: string }>(`user/${username}`),
    enabled: !!username,
    staleTime: Infinity,
    retry: 1,
  });
  const { data: viewerId } = useQuery(hikkaViewerQuery);
  // Nothing (not the account's own) until the profile's user is known.
  const songs = useFavoriteSongs(user?.reference ?? '')?.data;
  const active = useMusicTab((state) => state.username === username);
  return {
    username,
    songs: user ? songs : undefined,
    isOwner: !!user && viewerId === user.reference,
    active,
  };
}

/**
 * "Музика" among the tabs of the favourites on a user's profile and on
 * their full list: the openings and endings they liked in the music player.
 */
export default class MusicFavoritesFeature extends AnchoredUisFeature {
  readonly id = TAG;
  readonly pages = [HikkaPages.UserPage, HikkaPages.UserFavoritesPage];

  async init() {
    const { ctx } = usePageStore.getState();
    const style = document.createElement('style');
    style.textContent = STYLE;
    document.head.append(style);
    ctx.onInvalidated(() => style.remove());

    this.integrate([
      {
        find: findTabList,
        render: (tabList) => <MusicChip tabList={tabList} />,
      },
    ]);
    const section = await this.createUi({
      position: 'inline',
      anchor: findTabs,
      append: 'after',
      // No box of its own: empty, it adds no gap to the block's column.
      hostCss: 'display: contents;',
      render: (container) => <MusicSection container={container} />,
    });
    const standalone = await this.createUi({
      position: 'inline',
      anchor: findEmptySlot,
      append: 'last',
      render: () => <StandaloneBlock />,
    });
    this.uis.push(
      {
        present: () => !!findTabs(),
        ui: section as unknown as (typeof this.uis)[number]['ui'],
        element: () => section.shadowHost,
      },
      {
        present: () => !!findEmptySlot(),
        ui: standalone as unknown as (typeof this.uis)[number]['ui'],
        element: () => standalone.shadowHost,
      },
    );
  }

  override get shouldMount(): boolean {
    return (
      super.shouldMount && useSettings.getState().features.musicPlayer.enabled
    );
  }

  override unmount() {
    super.unmount();
    // Off the user's pages, the chip is forgotten, as hikka.io's tabs are.
    if (!super.shouldMount) useMusicTab.setState({ username: undefined });
  }
}

const MusicIcon = MaterialSymbolsLibraryMusicRounded;

/** The chip, in hikka.io's tab list; hikka.io's own tabs leave the music. */
const MusicChip: FC<{ tabList: HTMLElement }> = ({ tabList }) => {
  const { username, songs, isOwner, active } = useProfileMusic();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const tab = (event.target as Element).closest('[role="tab"]');
      if (tab && !tab.closest(TAG))
        useMusicTab.setState({ username: undefined });
    };
    tabList.addEventListener('click', onClick);
    return () => tabList.removeEventListener('click', onClick);
  }, [tabList]);

  // Empty lists show only to their owner, as hikka.io's do.
  if (!songs || (!isOwner && songs.length === 0)) return null;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-label={`Музика: ${songs.length}`}
      tabIndex={active ? 0 : -1}
      className={`${CHIP} ${active ? CHIP_ACTIVE : CHIP_IDLE}`}
      onClick={() => useMusicTab.setState({ username })}
    >
      <MusicIcon className="size-4 shrink-0" />
      Музика
      <span className="tabular-nums opacity-60">{songs.length}</span>
    </button>
  );
};

/** The music in place of hikka.io's cards, while the chip is chosen. */
const MusicSection: FC<{ container: HTMLElement }> = ({ container }) => {
  const { username, songs, isOwner, active } = useProfileMusic();

  useEffect(() => {
    if (!active) return;
    const block = (container.getRootNode() as ShadowRoot).host.closest(
      '#user-favorites',
    );
    block?.setAttribute(SHOWING_MUSIC, '');
    return () => block?.removeAttribute(SHOWING_MUSIC);
  }, [active, container]);

  if (!active || !songs || !username) return null;
  return (
    <SongGrid
      songs={songs}
      isOwner={isOwner}
      username={username}
      extended={isFullList()}
    />
  );
};

/**
 * The favourites block on its own, for a visitor of a profile whose Hikka
 * favourites are all empty but whose music isn't.
 */
const StandaloneBlock = () => {
  const { songs, username } = useProfileMusic();
  if (!songs?.length || !username) return null;
  return (
    <section className="flex min-w-0 flex-col gap-5">
      <h3 className="text-lg leading-7 font-bold">Улюблені</h3>
      <div role="tablist" className="flex gap-2">
        <span
          role="tab"
          aria-selected
          className="border-primary/40 bg-primary/15 text-primary inline-flex h-8 items-center gap-1.5 rounded-md border px-3.5 text-sm font-medium"
        >
          <MusicIcon className="size-4 shrink-0" />
          Музика
          <span className="tabular-nums opacity-60">{songs.length}</span>
        </span>
      </div>
      <SongGrid songs={songs} isOwner={false} username={username} all />
    </section>
  );
};

interface GridProps {
  songs: FavoriteSong[];
  isOwner: boolean;
  username: string;
  /** The full list's grid, not the profile's row. */
  extended?: boolean;
  /** Every song in the row, with no link to the full list. */
  all?: boolean;
}

const SongGrid: FC<GridProps> = ({
  songs,
  isOwner,
  username,
  extended,
  all,
}) => {
  if (songs.length === 0) {
    return (
      <EmptyState
        bordered
        icon={<MusicIcon />}
        title={
          <span>
            У списку <span className="font-black">Музика</span> пусто
          </span>
        }
        description={
          isOwner
            ? 'Додавайте опенінги й ендінги сердечком у блоці музики тайтлу або в програвачі'
            : 'Цей список оновиться після того, як сюди буде додано музику'
        }
      />
    );
  }

  const tracks = songs.map(favoriteTrack);
  const overflow = !extended && !all && songs.length > PREVIEW;
  const shown = overflow ? songs.slice(0, PREVIEW - 1) : songs;

  return (
    <div
      className={
        extended
          ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-7 lg:gap-6'
          : 'no-scrollbar auto-cols-scroll -mx-4 -my-4 grid grid-flow-col gap-4 overflow-x-scroll px-4 py-4 [--grid-min:7rem] md:grid-cols-6 lg:gap-6'
      }
    >
      {shown.map((song, index) => (
        <SongCard
          key={`${song.animeSlug}:${song.ostType}:${song.index}`}
          song={song}
          onPlay={() => playMusic(tracks, index)}
        />
      ))}
      {overflow && (
        <MoreCard
          count={songs.length}
          image={coverOf(songs[PREVIEW - 1])}
          username={username}
        />
      )}
    </div>
  );
};

const SongCard: FC<{ song: FavoriteSong; onPlay: () => void }> = ({
  song,
  onPlay,
}) => {
  const track = favoriteTrack(song);
  const isCurrent = useMusic((state) => currentTrack(state)?.key === track.key);
  const playing = useMusic((state) => state.playing) && isCurrent;
  const href = `/anime/${song.animeSlug}`;

  return (
    <div className="group relative flex w-full min-w-0 flex-col gap-2">
      <Poster image={coverOf(song)} ratio={1} fade>
        <button
          type="button"
          aria-label={
            playing ? `Призупинити «${song.title}»` : `Слухати «${song.title}»`
          }
          className="focus-visible:ring-ring absolute inset-0 flex items-end justify-end bg-linear-to-t from-black/60 via-transparent to-transparent p-2 opacity-0 transition-opacity outline-none group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 data-[current=true]:opacity-100 [@media(hover:none)]:opacity-100"
          data-current={isCurrent}
          onClick={() => (isCurrent ? useMusic.getState().toggle() : onPlay())}
        >
          <span className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-full shadow-md transition-transform group-hover:scale-105 active:scale-95">
            {playing ? (
              <>
                <Equalizer playing className="group-hover:hidden" />
                <MaterialSymbolsPauseRounded className="hidden size-6 group-hover:block" />
              </>
            ) : (
              <MaterialSymbolsPlayArrowRounded className="size-6" />
            )}
          </span>
        </button>
        <LikeButton
          track={track}
          className="absolute top-1.5 right-1.5 bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/60 hover:text-white focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
        />
      </Poster>
      <a
        href={href}
        onClick={onHikkaLinkClick}
        title={song.animeTitle}
        className="grid min-w-0"
      >
        <span
          className={cn(
            'truncate text-sm leading-5 font-medium',
            isCurrent && 'text-primary',
          )}
        >
          {song.title}
        </span>
        <span className="text-muted-foreground mt-1 truncate text-xs leading-tight font-medium">
          {[`${OST_LABEL[song.ostType]} ${song.index}`, song.animeTitle]
            .filter(Boolean)
            .join(' • ')}
        </span>
      </a>
    </div>
  );
};

/** The song's album cover, else its anime's poster. */
const coverOf = (song: FavoriteSong | undefined) =>
  song?.release?.cover ?? song?.poster;

/** hikka.io's last card of a preview: the total over the next poster, blurred. */
const MoreCard: FC<{
  count: number;
  image?: string;
  username: string;
}> = ({ count, image, username }) => {
  const href = `/u/${encodeURIComponent(username)}/favorites`;
  return (
    <a
      href={href}
      onClick={(event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey) return;
        event.preventDefault();
        navigateOnHikka(href);
      }}
      className="flex flex-col gap-2"
    >
      <Poster ratio={1}>
        <div className="@container absolute inset-0">
          <FadeImage src={image} />
          <div className="absolute inset-x-0 bottom-0 h-3/5 [mask-image:linear-gradient(to_top,black_60%,transparent)] backdrop-blur-lg" />
          <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col p-2 text-white @min-[8rem]:p-3">
            <div className="flex items-center justify-between gap-1">
              <span className="text-lg leading-6 font-bold tabular-nums @min-[8rem]:text-2xl @min-[8rem]:leading-8">
                {count}
              </span>
              <MaterialSymbolsArrowRightAltRounded className="size-5" />
            </div>
            <span className="truncate text-xs leading-4 text-white/70">
              {plural(count, TRACK_FORMS)}
            </span>
          </div>
        </div>
      </Poster>
    </a>
  );
};
