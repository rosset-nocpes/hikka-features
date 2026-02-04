import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from 'zustand/middleware';

const extensionStorage: StateStorage = {
  getItem: async (name: string): Promise<any | null> => {
    const data = await browser.storage.local.get(name);
    return data[name] || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await browser.storage.local.set({ [name]: value });
  },
  removeItem: async (name: string): Promise<void> => {
    await browser.storage.local.remove(name);
  },
};

interface AppState {
  // State Values
  hikkaSecret?: { secret: string; expiration: number };
  userData?: UserDataV2;
  backendBranch: BackendBranches;
  richPresence: boolean;
  darkMode: boolean;

  features: {
    aniBackground: {
      enabled: boolean;
    };
    localizedPoster: {
      enabled: boolean;
      autoShow: boolean;
    };
    player: {
      enabled: boolean;
      defaultProvider: string;
      favoriteTeams: Record<string, { provider: string; team: string }>;
    };
    reader: {
      enabled: boolean;
    };
    aniButtons: {
      enabled: boolean;
    };
    fandubBlock: {
      enabled: boolean;
    };
    recommendationBlock: {
      enabled: boolean;
    };
    editorCharacters: {
      enabled: boolean;
    };
    devOptions: {
      enabled: boolean;
      devTools: boolean;
      burunyaaMode: boolean;
    };
  };

  // Actions
  setSettings: (settings: Partial<AppState>) => void;
  updateFeatureSettings: <K extends keyof AppState['features']>(
    featureName: K,
    settings: Partial<AppState['features'][K]>,
  ) => void;
}

interface StorageInterface {
  aniBackState: boolean | undefined;
  localizedPosterState: boolean | undefined;
  localizedPosterButtonState: boolean | undefined;
  watchButtonState: boolean | undefined;
  playerAnimeFavoriteTeam:
    | Record<string, { provider: string; team: string }>
    | undefined;
  readerButtonState: boolean | undefined;
  hikkaSecret: string | undefined;
  userData: UserDataV2 | undefined;
  aniButtonsState: boolean | undefined;
  fandubBlockState: boolean | undefined;
  recommendationBlockState: boolean | undefined;
  defaultPlayer: string | undefined;
  devOptionsState: boolean | undefined;
  backendBranch: BackendBranches | undefined;
  burunyaaMode: boolean | undefined;
  devMode: boolean | undefined;
  richPresence: boolean | undefined;
  darkMode: boolean | undefined;
}

export const useSettings = create<AppState>()(
  persist(
    (set) => ({
      features: {
        aniBackground: {
          enabled: true,
        },
        localizedPoster: {
          enabled: true,
          autoShow: false,
        },
        player: {
          enabled: true,
          defaultProvider: 'moon',
          favoriteTeams: {},
        },
        reader: {
          enabled: true,
        },
        aniButtons: {
          enabled: true,
        },
        fandubBlock: {
          enabled: true,
        },
        recommendationBlock: {
          enabled: true,
        },
        editorCharacters: {
          enabled: true,
        },
        devOptions: {
          enabled: false,
          devTools: import.meta.env.MODE === 'development',
          burunyaaMode: false,
        },
      },
      hikkaSecret: undefined,
      userData: undefined,
      backendBranch:
        import.meta.env.MODE === 'development' ? 'localhost' : 'stable',
      richPresence: false,
      darkMode: true,

      // Generic setter
      setSettings: (settings) => set((state) => ({ ...state, ...settings })),
      updateFeatureSettings: (featureName, settings) =>
        set((state) => ({
          ...state,
          features: {
            ...state.features,
            [featureName]: { ...state.features[featureName], ...settings },
          },
        })),
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => extensionStorage),
      partialize: (state) => ({
        features: state.features,
        hikkaSecret: state.hikkaSecret,
        userData: state.userData,
        backendBranch: state.backendBranch,
        richPresence: state.richPresence,
        darkMode: state.darkMode,
      }),
      version: 0,
      migrate: async (persisted: any, version) => {
        const oldStorage: StorageInterface = await browser.storage.local.get();

        if (oldStorage.darkMode) {
          await browser.storage.local.clear();

          persisted = {
            ...persisted,
            features: {
              ...persisted.features,
              aniBackground: {
                enabled:
                  oldStorage.aniBackState ||
                  persisted.features.aniBackground.enabled,
              },
              localizedPoster: {
                enabled:
                  oldStorage.localizedPosterButtonState ||
                  persisted.features.localizedPoster.enabled,
                autoShow:
                  oldStorage.localizedPosterState ||
                  persisted.features.localizedPoster.autoShow,
              },
              player: {
                enabled:
                  oldStorage.watchButtonState ||
                  persisted.features.player.enabled,
                defaultProvider:
                  oldStorage.defaultPlayer ||
                  persisted.features.player.defaultProvider,
                favoriteTeams:
                  oldStorage.playerAnimeFavoriteTeam ||
                  persisted.features.player.favoriteTeams,
              },
              reader: {
                enabled:
                  oldStorage.readerButtonState ||
                  persisted.features.reader.enabled,
              },
              aniButtons: {
                enabled:
                  oldStorage.aniButtonsState ||
                  persisted.features.aniButtons.enabled,
              },
              fandubBlock: {
                enabled:
                  oldStorage.fandubBlockState ||
                  persisted.features.fandubBlock.enabled,
              },
              recommendationBlock: {
                enabled:
                  oldStorage.recommendationBlockState ||
                  persisted.features.recommendationBlock.enabled,
              },
              devOptions: {
                enabled:
                  oldStorage.devOptionsState ||
                  persisted.features.devOptions.enabled,
                devTools:
                  oldStorage.devMode || persisted.features.devOptions.devTools,
                burunyaaMode:
                  oldStorage.burunyaaMode ||
                  persisted.features.devOptions.burunyaaMode,
              },
            },
          };
        }

        return persisted;
      },
    },
  ),
);

// update storage for content script
if (
  typeof chrome !== 'undefined' &&
  browser.storage &&
  browser.storage.onChanged
) {
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.settings) {
      const newValue = changes.settings.newValue;

      if (newValue) {
        const parsed =
          typeof newValue === 'string' ? JSON.parse(newValue) : newValue;

        useSettings.setState(parsed.state);
      }
    }
  });
}
