export const aniBackState = storage.defineItem<boolean>('local:aniBackState', {
  fallback: true,
});

export const localizedPosterState = storage.defineItem<boolean>(
  'local:localizedPosterState',
  {
    fallback: false,
  },
);

export const localizedPosterButtonState = storage.defineItem<boolean>(
  'local:localizedPosterButtonState',
  {
    fallback: true,
  },
);

export const watchButtonState = storage.defineItem<boolean>(
  'local:watchButtonState',
  {
    fallback: true,
  },
);

export const readerButtonState = storage.defineItem<boolean>(
  'local:readerButtonState',
  {
    fallback: true,
  },
);

export const hikkaSecret = storage.defineItem<string>('local:hikkaSecret', {
  version: 2,
  migrations: {
    2: (oldValue: HikkaSecretV1): string => {
      hikkaSecret.setMeta({ expiration: oldValue.expiration });
      return oldValue.secret;
    },
  },
});

export const userData = storage.defineItem<UserDataV2>('local:userData', {
  version: 2,
  migrations: {
    2: (oldValue: UserDataV1): UserDataV2 => {
      let r: any;
      hikkaSecret.getValue().then((r) => {
        if (r !== null && typeof r === 'string') {
          getUserData().then((result) => {
            r = result;
          });
        }
      });

      return {
        hikkaId: r['reference'],
        username: r['username'],
        avatar: r['avatar'],
      };
    },
  },
});

export const aniButtonsState = storage.defineItem<boolean>(
  'local:aniButtonsState',
  {
    fallback: true,
  },
);

export const fandubBlockState = storage.defineItem<boolean>(
  'local:fandubBlockState',
  {
    fallback: true,
  },
);

export const recommendationBlockState = storage.defineItem<boolean>(
  'local:recommendationBlockState',
  {
    fallback: true,
  },
);

export const defaultPlayer = storage.defineItem<PlayerSource>(
  'local:defaultPlayer',
  {
    fallback: 'moon',
  },
);

export const devOptionsState = storage.defineItem<boolean>(
  'local:devOptionsState',
  {
    fallback: false,
  },
);

export const backendBranch = storage.defineItem<BackendBranches>(
  'local:backendBranch',
  {
    fallback: import.meta.env.MODE === 'development' ? 'localhost' : 'stable',
  },
);

export const burunyaaMode = storage.defineItem<boolean>('local:burunyaaMode', {
  fallback: false,
});

export const devMode = storage.defineItem<boolean>('local:devMode', {
  fallback: import.meta.env.MODE === 'development',
});

export const richPresence = storage.defineItem<boolean>('local:richPresence', {
  fallback: false,
});

export const darkMode = storage.defineItem<boolean>('local:darkMode', {
  fallback: true,
});
