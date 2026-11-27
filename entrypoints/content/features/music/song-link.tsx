import type { FC } from 'react';

import MdiApple from '~icons/mdi/apple';
import MdiSpotify from '~icons/mdi/spotify';
import MdiYoutube from '~icons/mdi/youtube';

import { MediaTooltip } from '@/components/media/controls';
import { Button } from '@/components/ui/button';
import { Hint } from '@/components/ui/tooltip';
import { NEW_TAB } from '@/utils/hikka-router';

import type { SongRelease } from './use-song-releases';

const STORES = [
  { host: 'open.spotify.com', name: 'у Spotify', Icon: MdiSpotify },
  { host: 'music.youtube.com', name: 'на YouTube Music', Icon: MdiYoutube },
  { host: 'music.apple.com', name: 'в Apple Music', Icon: MdiApple },
];

const storeOf = (link: string) => {
  try {
    const { hostname } = new URL(link);
    return STORES.find(
      ({ host }) => hostname === host || hostname.endsWith(`.${host}`),
    );
  } catch {
    return undefined;
  }
};

interface Props {
  /** Hikka's own Spotify link, which wins. */
  spotify?: string | null;
  release?: Pick<SongRelease, 'link' | 'album' | 'released'>;
  className?: string;
  /** A player's tooltip, rather than the plain one. */
  tooltip?: boolean;
}

/** The full song, not AnimeThemes' TV cut, on a store that has it. */
const SongLink: FC<Props> = ({ spotify, release, className, tooltip }) => {
  const link = spotify || release?.link;
  const store = link && storeOf(link);
  if (!link || !store) return null;

  const label = `Повна версія ${store.name}`;
  const album =
    !spotify && release?.album
      ? `альбом «${release.album}»${release.released ? `, ${release.released.slice(0, 4)}` : ''}`
      : undefined;
  const hint = album ? `${label} · ${album}` : label;
  const button = (
    <Button
      variant="ghost"
      size="icon-sm"
      nativeButton={false}
      className={cn('shrink-0', className)}
      // A tooltip names it itself; an undefined label would override that.
      {...(tooltip ? {} : { 'aria-label': label })}
      render={
        <a
          href={link}
          {...NEW_TAB}
          onClick={(event) => event.stopPropagation()}
        />
      }
    >
      <store.Icon className="size-4.5" />
    </Button>
  );
  return tooltip ? (
    <MediaTooltip label={hint}>{button}</MediaTooltip>
  ) : (
    <Hint label={hint}>{button}</Hint>
  );
};

export default SongLink;
