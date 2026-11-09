/**
 * Moon's player (moonanime.net) marks openings, endings and recaps, and has
 * a postMessage API for the page that embeds it. Its own controls are hidden
 * behind the overlay, so the overlay offers the skips instead.
 */

/** A part of the episode the user may skip, in seconds. */
export interface SkipSegment {
  /** Moon's segment type: `opening`, `mixed_opening`, `ending`, … */
  type: string;
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
 * user, who gets a button.
 */
export const playerSrc = (videoUrl?: string) => {
  const url = videoUrl ? parseUrl(videoUrl) : undefined;
  if (!url || !isMoonUrl(url)) return videoUrl;
  url.searchParams.set('autoskip', 'none');
  return url.toString();
};

const SEGMENTS_REQUEST_ID = 'hikka-features:skip-segments';

/** Asks moon's player in `iframe` for its segments; `skipSegmentsOf` reads the reply. */
export const requestSkipSegments = (iframe: HTMLIFrameElement) => {
  const url = parseUrl(iframe.src);
  if (!url || !isMoonUrl(url)) return;
  iframe.contentWindow?.postMessage(
    { ns: 'ma', cmd: 'get_skip_segments', id: SEGMENTS_REQUEST_ID },
    url.origin,
  );
};

/** The segments in moon's reply to `requestSkipSegments`, else undefined. */
export const skipSegmentsOf = (message: unknown) => {
  if (!message || typeof message !== 'object') return undefined;
  const reply = message as Record<string, unknown>;
  if (reply.ns !== 'ma' || reply.id !== SEGMENTS_REQUEST_ID) return undefined;
  if (!Array.isArray(reply.data)) return [];

  return reply.data.flatMap((item): SkipSegment[] => {
    const { t, s, e } = (item ?? {}) as Record<string, unknown>;
    return typeof t === 'string' &&
      typeof s === 'number' &&
      typeof e === 'number' &&
      Number.isFinite(s) &&
      Number.isFinite(e) &&
      e > s
      ? [{ type: t, start: s, end: e }]
      : [];
  });
};
