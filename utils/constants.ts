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
