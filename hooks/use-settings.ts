import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from 'zustand/middleware';

import type {
  CatalogTeam,
  PreferredTranslation,
  TranslationType,
} from '@/utils/convex-api';

import { StoredValue } from '@/utils/stored-value';

/** For zustand's `persist`: each store is one JSON string in `storage.local`. */
export const extensionStorage: StateStorage = {
  getItem: (name) =>
    new StoredValue<string>(name).get().then((value) => value || null),
  setItem: (name, value) => new StoredValue<string>(name).set(value),
  removeItem: (name) => new StoredValue(name).remove(),
};

/** Rehydrates a persisted store whenever another context saves it. */
export const followStoredChanges = (
  store: { persist: { rehydrate: () => unknown } },
  name: string,
) => new StoredValue(name).watch(() => void store.persist.rehydrate());

let hasMigratedFromOldStorage = false;

/**
 * An anime's favourite team, whichever provider plays it. Older favourites
 * have only the team's name (see findFavorite).
 */
export interface FavoriteTeam {
  /** The watch data's key for the team. */
  key?: string;
  /** Its name. */
  team: string;
  teamId?: string;
  translationType?: TranslationType;
}

interface AppState {
  convexSession?: { refreshToken: string };
  userData?: UserDataV2;
  /** Account `updatedAt` of the team priority at the last sync; 0 = never. */
  teamPrioritySyncedAt: number;

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
      disableBlur: boolean;
      miniModeType: 'custom' | 'video-native';
      favoriteTeams: Record<string, FavoriteTeam>;
      /** Catalog teams, most preferred first (see pickPriorityTeam). */
      teamPriority: CatalogTeam[];
      /** Version of those teams' releases to open and be notified about. */
      teamPriorityTranslation: PreferredTranslation;
      /** What follows an episode starts by itself after a short countdown. */
      autoplayNext: boolean;
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
    /**
     * Where the "friends' activity" block sits among the homepage's
     * widgets, which hikka.io keeps in the account and can't hold ours.
     */
    friendsActivity: {
      hidden: boolean;
      /** Its column, for when neither neighbour is on the page. */
      side: 'left' | 'center' | 'right';
      /**
       * The site widgets right before and after it, by slug; null at either
       * end of its column, which survives storage as undefined wouldn't.
       */
      after: string | null;
      before: string | null;
    };
    editorCharacters: {
      enabled: boolean;
    };
    /** The floating bar of tools on hikka.io's edit pages. */
    editorToolbar: {
      enabled: boolean;
    };
    devOptions: {
      enabled: boolean;
      devTools: boolean;
      burunyaaMode: boolean;
    };
  };

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
          disableBlur: false,
          miniModeType: 'custom',
          favoriteTeams: {},
          teamPriority: [],
          teamPriorityTranslation: 'dub',
          autoplayNext: true,
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
        friendsActivity: {
          hidden: false,
          side: 'left',
          after: 'tracker',
          before: 'list',
        },
        editorCharacters: {
          enabled: true,
        },
        editorToolbar: {
          enabled: true,
        },
        devOptions: {
          enabled: false,
          devTools: import.meta.env.MODE === 'development',
          burunyaaMode: false,
        },
      },
      teamPrioritySyncedAt: 0,

      setSettings: set,
      updateFeatureSettings: (featureName, settings) =>
        set((state) => ({
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
        convexSession: state.convexSession,
        userData: state.userData,
        teamPrioritySyncedAt: state.teamPrioritySyncedAt,
      }),
      merge: (persisted, current) => {
        const stored = persisted as Partial<AppState> | undefined;
        return {
          ...current,
          // JSON drops them once signed out, so another context's logout
          // would otherwise keep this one's session.
          convexSession: undefined,
          userData: undefined,
          ...stored,
          // Merge each feature over its defaults, so settings added in later
          // versions start from their default instead of undefined.
          features: Object.fromEntries(
            Object.entries(current.features).map(([name, defaults]) => [
              name,
              {
                ...defaults,
                ...stored?.features?.[name as keyof AppState['features']],
              },
            ]),
          ) as AppState['features'],
        };
      },
      onRehydrateStorage: () => () => {
        if (!hasMigratedFromOldStorage) {
          hasMigratedFromOldStorage = true;
          void migrateFromOldStorage();
        }
      },
    },
  ),
);

followStoredChanges(useSettings, 'settings');

/** Moves settings kept as separate keys, before `settings`, into it. */
const migrateFromOldStorage = async () => {
  const old: Record<string, any> = await browser.storage.local.get();
  if (old.settings !== undefined) return;

  await browser.storage.local.clear();
  const { features, userData } = useSettings.getState();
  useSettings.setState({
    userData: old.userData || userData,
    features: {
      ...features,
      aniBackground: {
        enabled: old.aniBackState ?? features.aniBackground.enabled,
      },
      localizedPoster: {
        enabled:
          old.localizedPosterButtonState ?? features.localizedPoster.enabled,
        autoShow: old.localizedPosterState ?? features.localizedPoster.autoShow,
      },
      player: {
        ...features.player,
        enabled: old.watchButtonState ?? features.player.enabled,
        defaultProvider: old.defaultPlayer || features.player.defaultProvider,
        favoriteTeams:
          old.playerAnimeFavoriteTeam || features.player.favoriteTeams,
      },
      reader: { enabled: old.readerButtonState ?? features.reader.enabled },
      aniButtons: {
        enabled: old.aniButtonsState ?? features.aniButtons.enabled,
      },
      fandubBlock: {
        enabled: old.fandubBlockState ?? features.fandubBlock.enabled,
      },
      recommendationBlock: {
        enabled:
          old.recommendationBlockState ?? features.recommendationBlock.enabled,
      },
      devOptions: {
        enabled: old.devOptionsState ?? features.devOptions.enabled,
        devTools: old.devMode ?? features.devOptions.devTools,
        burunyaaMode: old.burunyaaMode ?? features.devOptions.burunyaaMode,
      },
    },
  });
};
