export const BACKEND_BRANCHES: Record<BackendBranches, string> = {
  stable: 'https://api.hikka-features.pp.ua',
  localhost: import.meta.env.WXT_BACKEND_BASE_URL || 'http://localhost:8000',
};

export const BACKEND_WS_URL = 'wss://api.hikka-features.pp.ua/ws';

export enum ProviderLanguage {
  UKRAINIAN = 'uk',
  ENGLISH = 'en',
  MULTILINGUAL = 'multi',
}
export const LANGUAGE_GROUP_NAMES: Record<ProviderLanguage, string> = {
  [ProviderLanguage.UKRAINIAN]: 'Українськомовні',
  [ProviderLanguage.ENGLISH]: 'Англомовні',
  [ProviderLanguage.MULTILINGUAL]: 'Багатомовні',
};
export const ALL_LANGUAGES: ProviderLanguage[] =
  Object.values(ProviderLanguage);

export const CLIENT_REFERENCE: string = 'a327508d-64e2-4a09-8ae2-c1e313bde39a';

export const NEEDED_SCOPES: string[] = [
  'read:user-details',
  // TODO: add scope for reading followings
  'read:follow',
  // "update:user-details:description",
];
