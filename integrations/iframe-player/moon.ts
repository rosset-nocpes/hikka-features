/**
 * Moon's player (moonanime.net) marks openings itself and skips them unless
 * told not to. The extension finds openings and endings on its own (see the
 * backend's `skip` functions) and offers the skip, so Moon must not.
 */

const isMoonUrl = (url: URL) =>
  /(^|\.)moonanime\.(net|art)$/.test(url.hostname);

const parseUrl = (url: string) => {
  try {
    return new URL(url);
  } catch {
    return undefined;
  }
};

/**
 * The episode's player address. Moon skips openings by itself by default;
 * `autoskip=none` (which beats the viewer's saved choice) leaves it to the
 * user, who gets the overlay's button.
 */
export const playerSrc = (videoUrl?: string) => {
  const url = videoUrl ? parseUrl(videoUrl) : undefined;
  if (!url || !isMoonUrl(url)) return videoUrl;
  url.searchParams.set('autoskip', 'none');
  return url.toString();
};
