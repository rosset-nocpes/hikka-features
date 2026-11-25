/** The players the backend reads episodes from, in the order offered. */
export const PROVIDERS = ['moon', 'ashdi', 'tortuga'] as const;

export type Provider = (typeof PROVIDERS)[number];

/** The player opened when an anime has several. */
export const DEFAULT_PROVIDER: Provider = 'moon';
