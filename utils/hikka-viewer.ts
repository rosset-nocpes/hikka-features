const HIKKA_PROFILE_URL = 'https://api.hikka.io/user/me';

/**
 * The Hikka user signed in to hikka.io in this browser, which need not be
 * the extension's account; account content is only shown to that user.
 */
export async function getHikkaViewerId() {
  const response = await fetch(HIKKA_PROFILE_URL, {
    cache: 'no-store',
    credentials: 'include',
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) return undefined;

  const profile = (await response.json()) as { reference?: unknown };
  return typeof profile.reference === 'string' ? profile.reference : undefined;
}
