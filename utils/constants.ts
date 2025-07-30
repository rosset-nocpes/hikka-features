export const BACKEND_BRANCHES: Record<BackendBranches, string> = {
  stable: 'https://api.hikka-features.pp.ua',
  localhost: import.meta.env.WXT_BACKEND_BASE_URL,
};

export const UkrainianPlayerSource = ['moon', 'ashdi'];
export const SubPlayerSource = ['vidsrc', 'hikari'];

export const CLIENT_REFERENCE: string = 'a327508d-64e2-4a09-8ae2-c1e313bde39a';

export const NEEDED_SCOPES: string[] = [
  'read:user-details',
  // TODO: add scope for reading followings
  'read:follow',
  // "update:user-details:description",
];
