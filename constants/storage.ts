/**
 * Keys in `storage.local`, which every context of the extension shares.
 * Persisted zustand stores keep one JSON string under their name.
 */
export const STORAGE_KEYS = {
  settings: 'settings',
  playerQueue: 'player-queue',
  readerSettings: 'reader-settings',
  musicVolume: 'music-volume',
  musicModes: 'music-modes',
  accountLogin: 'account-login',
  watchTogetherClosedInvites: 'watchTogetherClosedInvites',
  compatibility: 'extensionCompatibility',
} as const;

/**
 * Keys of settings from before they moved into `settings`, which
 * `migrateFromOldStorage` reads once and removes.
 */
export const LEGACY_SETTING_KEYS = [
  'userData',
  'aniBackState',
  'localizedPosterButtonState',
  'localizedPosterState',
  'watchButtonState',
  'defaultPlayer',
  'playerAnimeFavoriteTeam',
  'readerButtonState',
  'aniButtonsState',
  'fandubBlockState',
  'recommendationBlockState',
  'devOptionsState',
  'devMode',
  'burunyaaMode',
] as const;
