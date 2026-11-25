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

import { DEFAULT_PROVIDER } from '@/constants/providers';
import { LEGACY_SETTING_KEYS, STORAGE_KEYS } from '@/constants/storage';
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
      /**
       * Openings, endings and recaps: no button, a button to skip them, or
       * skipped as they start (once each, so seeking back plays them).
       */
      skipSegments: 'off' | 'button' | 'auto';
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
     * The anime's openings and endings as a playable track list, their
     * player, and the favourite songs on users' profiles.
     */
    musicPlayer: {
      enabled: boolean;
    };
    /** "Команди" in hikka.io's navbar and a teams group in its search. */
    teamLinks: {
      enabled: boolean;
    };
    /** New episodes from the priority teams, among hikka.io's notifications. */
    releaseNotifications: {
      enabled: boolean;
    };
    /** Friends' watch together invites, shown as they arrive. */
    watchTogetherInvites: {
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
          defaultProvider: DEFAULT_PROVIDER,
          disableBlur: false,
          miniModeType: 'custom',
          favoriteTeams: {},
          teamPriority: [],
          teamPriorityTranslation: 'dub',
          autoplayNext: true,
          skipSegments: 'button',
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
        musicPlayer: {
          enabled: true,
        },
        teamLinks: {
          enabled: true,
        },
        releaseNotifications: {
          enabled: true,
        },
        watchTogetherInvites: {
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
      name: STORAGE_KEYS.settings,
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

followStoredChanges(useSettings, STORAGE_KEYS.settings);

/**
 * Moves settings kept as separate keys, before `settings`, into it. Only
 * their keys go: a fresh install's other values (a login in progress, the
 * queue) stay.
 */
const migrateFromOldStorage = async () => {
  const old: Record<string, any> = await browser.storage.local.get([
    STORAGE_KEYS.settings,
    ...LEGACY_SETTING_KEYS,
  ]);
  if (
    old[STORAGE_KEYS.settings] !== undefined ||
    !LEGACY_SETTING_KEYS.some((key) => old[key] !== undefined)
  ) {
    return;
  }

  await browser.storage.local.remove([...LEGACY_SETTING_KEYS]);
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
