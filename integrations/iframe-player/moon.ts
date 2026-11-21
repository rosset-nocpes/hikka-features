/**
 * Moon's player (moonanime.net) marks openings, endings and recaps, skips
 * openings unless told not to, and has a postMessage API for the page that
 * embeds it. The extension finds openings and endings on its own (see the
 * backend's `skip` functions) and offers the skip, so Moon must not; its
 * recaps, which the audio can't tell, the overlay offers too.
 */

/** A recap the user may skip, in seconds. */
export interface Recap {
  start: number;
  end: number;
}

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

const SEGMENTS_REQUEST_ID = 'hikka-features:skip-segments';

/** Asks moon's player in `iframe` for its segments; `recapsOf` reads the reply. */
export const requestRecaps = (iframe: HTMLIFrameElement) => {
  const url = parseUrl(iframe.src);
  if (!url || !isMoonUrl(url)) return;
  iframe.contentWindow?.postMessage(
    { ns: 'ma', cmd: 'get_skip_segments', id: SEGMENTS_REQUEST_ID },
    url.origin,
  );
};

/** The recaps in moon's reply to `requestRecaps`, else undefined. */
export const recapsOf = (message: unknown) => {
  if (!message || typeof message !== 'object') return undefined;
  const reply = message as Record<string, unknown>;
  if (reply.ns !== 'ma' || reply.id !== SEGMENTS_REQUEST_ID) return undefined;
  if (!Array.isArray(reply.data)) return [];

  return reply.data.flatMap((item): Recap[] => {
    const { t, s, e } = (item ?? {}) as Record<string, unknown>;
    return t === 'recap' &&
      typeof s === 'number' &&
      typeof e === 'number' &&
      Number.isFinite(s) &&
      Number.isFinite(e) &&
      e > s
      ? [{ start: s, end: e }]
      : [];
  });
};
