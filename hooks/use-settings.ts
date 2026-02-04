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

let hasMigratedFromOldStorage = false;

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
      backendBranch: import.meta.env.WXT_BACKEND_BASE_URL
        ? 'localhost'
        : 'stable',
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
      onRehydrateStorage: () => () => {
        if (!hasMigratedFromOldStorage) {
          hasMigratedFromOldStorage = true;
          migrateFromOldStorage();
        }
      },
    },
  ),
);

browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.settings) {
    useSettings.persist.rehydrate();
  }
});

const migrateFromOldStorage = async () => {
  const oldStorage: any = await browser.storage.local.get();

  if (oldStorage.settings === undefined) {
    await browser.storage.local.clear();
    let state = useSettings.getState();

    state = {
      ...state,
      hikkaSecret:
        oldStorage.hikkaSecret !== undefined
          ? { secret: oldStorage.hikkaSecret, expiration: 0 }
          : state.hikkaSecret,
      userData: oldStorage.userData || state.userData,
      backendBranch: oldStorage.backendBranch || state.backendBranch,
      richPresence: oldStorage.richPresence ?? state.richPresence,
      darkMode: oldStorage.darkMode ?? state.darkMode,
      features: {
        ...state.features,
        aniBackground: {
          enabled:
            oldStorage.aniBackState ?? state.features.aniBackground.enabled,
        },
        localizedPoster: {
          enabled:
            oldStorage.localizedPosterButtonState ??
            state.features.localizedPoster.enabled,
          autoShow:
            oldStorage.localizedPosterState ??
            state.features.localizedPoster.autoShow,
        },
        player: {
          enabled: oldStorage.watchButtonState ?? state.features.player.enabled,
          defaultProvider:
            oldStorage.defaultPlayer || state.features.player.defaultProvider,
          favoriteTeams:
            oldStorage.playerAnimeFavoriteTeam ||
            state.features.player.favoriteTeams,
        },
        reader: {
          enabled:
            oldStorage.readerButtonState ?? state.features.reader.enabled,
        },
        aniButtons: {
          enabled:
            oldStorage.aniButtonsState ?? state.features.aniButtons.enabled,
        },
        fandubBlock: {
          enabled:
            oldStorage.fandubBlockState ?? state.features.fandubBlock.enabled,
        },
        recommendationBlock: {
          enabled:
            oldStorage.recommendationBlockState ??
            state.features.recommendationBlock.enabled,
        },
        devOptions: {
          enabled:
            oldStorage.devOptionsState ?? state.features.devOptions.enabled,
          devTools: oldStorage.devMode ?? state.features.devOptions.devTools,
          burunyaaMode:
            oldStorage.burunyaaMode ?? state.features.devOptions.burunyaaMode,
        },
      },
    };

    useSettings.setState(state);
  }
};
