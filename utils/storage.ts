export const aniBackState = storage.defineItem<boolean>("local:aniBackState", {
  defaultValue: true,
});

export const watchButtonState = storage.defineItem<boolean>(
  "local:watchButtonState",
  {
    defaultValue: true,
  }
);

export const aniButtonsState = storage.defineItem<boolean>(
  "local:aniButtonsState",
  {
    defaultValue: true,
  }
);

export const defaultPlayer = storage.defineItem<PlayerSource>(
  "local:defaultPlayer",
  {
    defaultValue: "moon",
  }
);

export const devOptionsState = storage.defineItem<boolean>(
  "local:devOptionsState",
  {
    defaultValue: false,
  }
);

export const backendBranch = storage.defineItem<BackendBranches>(
  "local:backendBranch",
  {
    defaultValue: "beta",
  }
);

export const burunyaaMode = storage.defineItem<boolean>("local:burunyaaMode", {
  defaultValue: false,
});
