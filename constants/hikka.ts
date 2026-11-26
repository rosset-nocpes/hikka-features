/** hikka.io: the site the extension runs on, and its API. */

/** The site's hosts: the live one and its preview. */
export const HIKKA_HOSTS = ['hikka.io', 'dev.hikka.io'] as const;

export const HIKKA_URL = 'https://hikka.io';
export const HIKKA_ORIGINS: readonly string[] = HIKKA_HOSTS.map(
  (host) => `https://${host}`,
);

/** Match patterns for every page of the site. */
export const HIKKA_MATCHES = HIKKA_ORIGINS.map((origin) => `${origin}/*`);

export const HIKKA_API_URL = 'https://api.hikka.io';

/** Where the site's images are; the backend keeps posters only from here. */
export const HIKKA_CDN_URL = 'https://cdn.hikka.io/';

/** Whether `url` (an absolute URL or an origin) is on one of the site's hosts. */
export const isHikkaUrl = (url: string) => {
  try {
    return HIKKA_ORIGINS.includes(new URL(url).origin);
  } catch {
    return false;
  }
};
