export const aniBackState = storage.defineItem<boolean>("local:aniBackState", {
  fallback: true,
});

export const localizedPosterState = storage.defineItem<boolean>(
  "local:localizedPosterState",
  {
    fallback: false,
  }
);

export const localizedPosterButtonState = storage.defineItem<boolean>(
  "local:localizedPosterButtonState",
  {
    fallback: true,
  }
);

export const watchButtonState = storage.defineItem<boolean>(
  "local:watchButtonState",
  {
    fallback: true,
  }
);

export const aniButtonsState = storage.defineItem<boolean>(
  "local:aniButtonsState",
  {
    fallback: true,
  }
);

export const fandubBlockState = storage.defineItem<boolean>(
  "local:fandubBlockState",
  {
    fallback: true,
  }
);

export const defaultPlayer = storage.defineItem<PlayerSource>(
  "local:defaultPlayer",
  {
    fallback: "moon",
  }
);

export const devOptionsState = storage.defineItem<boolean>(
  "local:devOptionsState",
  {
    fallback: false,
  }
);

export const backendBranch = storage.defineItem<BackendBranches>(
  "local:backendBranch",
  {
    fallback: "stable",
  }
);

export const burunyaaMode = storage.defineItem<boolean>("local:burunyaaMode", {
  fallback: false,
});
