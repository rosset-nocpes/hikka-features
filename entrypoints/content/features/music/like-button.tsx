import type { FC } from 'react';

import MaterialSymbolsFavoriteOutlineRounded from '~icons/material-symbols/favorite-outline-rounded';
import MaterialSymbolsFavoriteRounded from '~icons/material-symbols/favorite-rounded';

import { MediaTooltip } from '@/components/media/controls';
import SwapIcon from '@/components/swap-icon';
import { Button } from '@/components/ui/button';
import { Hint } from '@/components/ui/tooltip';

import type { Song } from './animethemes';

import { setSongLiked, useLikedSongs } from './use-music-favorites';

export const likeLabel = (liked: boolean) =>
  liked ? 'Прибрати з улюблених' : 'В улюблене';

/** hikka.io's heart: red and filled while the song is a favourite. */
export const LikeIcon: FC<{ liked: boolean }> = ({ liked }) => (
  <SwapIcon
    active={liked}
    on={<MaterialSymbolsFavoriteRounded className="size-5 text-red-500" />}
    off={<MaterialSymbolsFavoriteOutlineRounded className="size-5" />}
  />
);

interface Props {
  /** Playable or not: a favourite needn't be on AnimeThemes. */
  song: Song;
  /** Its release, once known, for its performer's full name. */
  release?: Song['release'];
  className?: string;
  /** A player's tooltip, rather than the plain one. */
  tooltip?: boolean;
}

/** Adds the song to the account's favourites, or takes it out. */
const LikeButton: FC<Props> = ({ song, release, className, tooltip }) => {
  const liked = useLikedSongs()(song);
  const label = likeLabel(liked);
  const button = (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-pressed={liked}
      // A tooltip names it itself; an undefined label would override that.
      {...(tooltip ? {} : { 'aria-label': label })}
      className={cn('shrink-0', className)}
      onClick={(event) => {
        // Rows and cards under it play on click.
        event.stopPropagation();
        event.preventDefault();
        void setSongLiked(song, !liked, release);
      }}
    >
      <LikeIcon liked={liked} />
    </Button>
  );
  return tooltip ? (
    <MediaTooltip label={label}>{button}</MediaTooltip>
  ) : (
    <Hint label={label}>{button}</Hint>
  );
};

export default LikeButton;
