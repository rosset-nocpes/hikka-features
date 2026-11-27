import { useQuery } from '@tanstack/react-query';

import type { HikkaContent, HikkaOst } from '@/hooks/use-hikka';

import { ANIMETHEMES_GRAPHQL_URL } from '@/constants/links';

const ENDPOINT = ANIMETHEMES_GRAPHQL_URL;

const QUERY = `query ($id: [Int!]) {
  findAnimeByExternalSite(site: MAL, id: $id) {
    animethemes {
      type
      sequence
      group { name }
      song {
        title { romaji native }
        performances { artist { name { main } } }
      }
      animethemeentries { videos { nodes { audio { link } } } }
    }
  }
}`;

interface AnimeTheme {
  type: 'OP' | 'ED' | 'IN';
  /** Null when the anime has only one theme of the type. */
  sequence: number | null;
  /** Another version of the theme, e.g. "TV Version" or a dub's. */
  group: { name: string } | null;
  song: {
    title: { romaji: string | null; native: string | null };
    performances?: { artist: { name: { main: string | null } } }[];
  } | null;
  animethemeentries: {
    videos: { nodes: { audio: { link: string } | null }[] };
  }[];
}

interface ThemesResponse {
  data?: {
    findAnimeByExternalSite: { animethemes: AnimeTheme[] }[] | null;
  } | null;
}

/**
 * An opening or ending, as a track list shows it and a favourite keeps it,
 * whether or not AnimeThemes has it to play.
 */
export interface Song {
  /** Unique across anime. */
  key: string;
  /** The anime's hikka.io slug. */
  slug: string;
  animeTitle?: string;
  poster?: string | null;
  type: HikkaOst['ost_type'];
  index: number;
  title: string;
  author?: string | null;
  /** The theme's audio (Ogg, TV size), from AnimeThemes; unset when it has none. */
  audio?: string;
  /** Its cover and album, when it came with them (a favourite does). */
  release?: {
    cover: string;
    album?: string;
    released?: string;
    link?: string;
    artist?: string;
  };
}

/** A song the music player can play: AnimeThemes has its audio. */
export type MusicTrack = Song & { audio: string };

export const isPlayable = (song: Song): song is MusicTrack => !!song.audio;

/**
 * Who performs the song. Hikka keeps only the first word of a name ("THE"
 * for THE DU), so a store's credit that starts with it stands in; so does
 * any, for a song that names no one.
 */
export const performerOf = (
  song: Pick<Song, 'author'>,
  release?: { artist?: string },
) => {
  const author = song.author?.trim();
  const artist = release?.artist;
  if (!author) return artist;
  return artist?.toLowerCase().startsWith(`${author.toLowerCase()} `)
    ? artist
    : author;
};

export const OST_LABEL: Record<HikkaOst['ost_type'], string> = {
  opening: 'Опенінґ',
  ending: 'Ендінґ',
};

const THEME_TYPE: Record<HikkaOst['ost_type'], AnimeTheme['type']> = {
  opening: 'OP',
  ending: 'ED',
};

/** Letters and digits only, for comparing titles spelt a little apart. */
const titleKey = (title?: string | null) =>
  title
    ?.normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '') ?? '';

/** Performers a track names; more are "та ін.", as in a credit. */
const PERFORMERS_SHOWN = 4;

/**
 * Who performs the theme, in full: Hikka keeps only the first word of a
 * name ("Kessoku" for Kessoku Band, "Gen" for Gen Hoshino).
 */
const performersOf = (theme: AnimeTheme | undefined) => {
  const names = new Set(
    theme?.song?.performances?.flatMap(({ artist }) =>
      artist.name.main ? [artist.name.main] : [],
    ),
  );
  if (!names.size) return undefined;
  // A choir of a theme (Uma Musume's has 34) reads, and saves, as its first.
  const shown = [...names].slice(0, PERFORMERS_SHOWN).join(', ');
  return names.size > PERFORMERS_SHOWN ? `${shown} та ін.` : shown;
};

const audioOf = (theme: AnimeTheme) =>
  theme.animethemeentries
    .flatMap((entry) => entry.videos.nodes)
    .find((video) => video.audio)?.audio?.link;

/**
 * Hikka's "Yuusha (勇者)" is AnimeThemes' romaji "Yuusha", native "勇者":
 * the same song when either name is in Hikka's, or the start of it.
 */
const sameSong = (ost: HikkaOst, theme: AnimeTheme) => {
  const hikka = titleKey(ost.title);
  const romaji = titleKey(theme.song?.title.romaji);
  const native = titleKey(theme.song?.title.native);
  return (
    !!hikka &&
    ((!!romaji && (hikka.startsWith(romaji) || romaji.startsWith(hikka))) ||
      (!!native && hikka.includes(native)))
  );
};

/**
 * The theme of `ost` among the anime's: the same song, else the same
 * number. Other versions (a TV cut, a dub) only when no original fits.
 */
export const findTheme = (ost: HikkaOst, themes: AnimeTheme[]) => {
  const candidates = themes
    .filter(
      (theme) => theme.type === THEME_TYPE[ost.ost_type] && audioOf(theme),
    )
    .sort((a, b) => Number(!!a.group) - Number(!!b.group));
  const sameNumber = (theme: AnimeTheme) => (theme.sequence ?? 1) === ost.index;
  return (
    candidates.find((theme) => sameSong(ost, theme) && sameNumber(theme)) ??
    candidates.find((theme) => sameSong(ost, theme)) ??
    candidates.find(sameNumber)
  );
};

/** Firefox's own globals in a content script. */
interface FirefoxContentScope {
  content?: Window;
  cloneInto?: <T>(value: T, target: object) => T;
}

/**
 * `fetch` as hikka.io makes it. Firefox sends a content script's requests as
 * the extension's, which AnimeThemes' API refuses (a network error), so they
 * go through the page's `fetch` there; Chrome already sends them as the page.
 */
const pageFetch = (url: string, init: RequestInit) => {
  const { content, cloneInto } = globalThis as FirefoxContentScope;
  return content?.fetch && cloneInto
    ? content.fetch(url, cloneInto(init, content))
    : fetch(url, init);
};

const fetchThemes = async (malId: number) => {
  const response = await pageFetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { id: [malId] } }),
  });
  if (!response.ok) throw new Error(`AnimeThemes: HTTP ${response.status}`);
  // Parsed here: Firefox's page objects are only partly readable from here.
  const { data } = JSON.parse(await response.text()) as ThemesResponse;
  // No such anime (or a GraphQL error): nothing to play, not a failure to retry.
  return (
    data?.findAnimeByExternalSite?.flatMap((anime) => anime.animethemes) ?? []
  );
};

/**
 * The anime's openings and endings Hikka lists, with the audio of those
 * AnimeThemes can play. Undefined while AnimeThemes is asked.
 */
export const useAnimeMusic = (anime?: HikkaContent, slug?: string) => {
  const malId = anime?.mal_id;
  const { data, isError } = useQuery({
    queryKey: ['animethemes', malId],
    queryFn: () => fetchThemes(malId!),
    enabled: !!malId && !!anime?.ost?.length,
    retry: 1,
    staleTime: Infinity,
  });
  // Without a MAL id or AnimeThemes, there's nothing to play: not loading.
  const themes = data ?? (isError || (anime && !malId) ? [] : undefined);

  if (!anime || !slug || !themes) return undefined;
  return (anime.ost ?? []).map((ost): Song => {
    const theme = findTheme(ost, themes);
    return {
      key: `${slug}:${ost.ost_type}:${ost.index}:${ost.title}`,
      slug,
      animeTitle: hikkaTitle(anime) ?? undefined,
      poster: anime.image,
      type: ost.ost_type,
      index: ost.index,
      title: ost.title,
      author: performersOf(theme) ?? ost.author,
      audio: theme && audioOf(theme),
    };
  });
};
