import ky from 'ky';

import type { IFramePlayerCommand } from '@/integrations/iframe-player/protocol';
import type {
  RemoteFetchRequest,
  RemoteFetchResponse,
} from '@/utils/remote-fetch';

import {
  COMPATIBILITY_STORAGE_KEY,
  EXTENSION_API_PROTOCOL,
  type ExtensionCompatibilityState,
  RELOAD_TABS_STORAGE_KEY,
} from '@/utils/compatibility';
import { convexApi } from '@/utils/convex-api';
import {
  convexMutation,
  convexPublicQuery,
  exchangeLoginCode,
  getHikkaAuthorizationUrl,
} from '@/utils/convex-client';
import { syncFavoritesFromConvex } from '@/utils/favorite-sync';

interface LoginRequest {
  type: 'login';
}

interface LoginResponse {
  authenticated: true;
  refreshToken: string;
  user: UserDataV2;
}

interface RichPresenceCheckRequest {
  type: 'rich-presence-check';
  action: string;
}

interface WatchTogetherRequest {
  type: 'watch-together';
  action: 'create' | 'join' | 'leave';
  roomId?: string;
}

interface HikkaContentLoadedRequest {
  type: 'hikka-content-loaded';
}

interface HikkaContentUnloadedRequest {
  type: 'hikka-content-unloaded';
}

interface HikkaContentStatusRequest {
  type: 'hikka-content-status';
}

interface CompatibilityStatusRequest {
  type: 'extension-compatibility-status';
}

interface ExtensionUpdateRequest {
  type: 'extension-update';
}

interface ReleaseNotificationSeenRequest {
  type: 'release-notification-seen';
  id: string;
}

type MessageRequest =
  | LoginRequest
  | RichPresenceCheckRequest
  | WatchTogetherRequest
  | RemoteFetchRequest
  | IFramePlayerCommand
  | HikkaContentLoadedRequest
  | HikkaContentUnloadedRequest
  | HikkaContentStatusRequest
  | CompatibilityStatusRequest
  | ExtensionUpdateRequest
  | ReleaseNotificationSeenRequest;

export default defineBackground(() => {
  const hikkaContentTabs = new Set<number>();
  const compatibilityAlarm = 'extension-compatibility';
  const legacyReleaseNotificationAlarm = 'release-notifications';
  const updateCheckCooldown = 6 * 60 * 60 * 1000;

  const getStoredCompatibility = async () => {
    const stored = await browser.storage.local.get(COMPATIBILITY_STORAGE_KEY);
    return stored[COMPATIBILITY_STORAGE_KEY] as
      | ExtensionCompatibilityState
      | undefined;
  };

  const publishCompatibility = async (state: ExtensionCompatibilityState) => {
    await browser.storage.local.set({
      [COMPATIBILITY_STORAGE_KEY]: state,
    });
    const tabs = await browser.tabs.query({
      url: ['https://hikka.io/*', 'https://dev.hikka.io/*'],
    });
    await Promise.allSettled(
      tabs.flatMap((tab) =>
        tab.id === undefined
          ? []
          : [
              browser.tabs.sendMessage(tab.id, {
                type: 'extension-compatibility',
                state,
              }),
            ],
      ),
    );
    return state;
  };

  const requestExtensionUpdate = async (
    state: ExtensionCompatibilityState,
    force = false,
  ) => {
    if (
      !force &&
      state.updateCheckedAt &&
      Date.now() - state.updateCheckedAt < updateCheckCooldown
    ) {
      return state;
    }

    const result = await browser.runtime.requestUpdateCheck();
    return await publishCompatibility({
      ...state,
      updateCheckedAt: Date.now(),
      storeStatus: result.status,
    });
  };

  const pollCompatibility = async () => {
    const extensionVersion = browser.runtime.getManifest().version;
    const [compatibility, previous] = await Promise.all([
      convexPublicQuery(convexApi.compatibility.get, {
        extensionVersion,
        protocol: EXTENSION_API_PROTOCOL,
      }),
      getStoredCompatibility(),
    ]);
    const sameRelease =
      previous?.extensionVersion === extensionVersion &&
      previous.latestVersion === compatibility.latestVersion;
    const state = await publishCompatibility({
      ...compatibility,
      extensionVersion,
      updateReady: sameRelease ? previous.updateReady : false,
      checkedAt: Date.now(),
      updateCheckedAt: sameRelease ? previous.updateCheckedAt : undefined,
      storeStatus: sameRelease ? previous.storeStatus : undefined,
    });

    return state.status === 'current'
      ? state
      : await requestExtensionUpdate(state);
  };

  const applyExtensionUpdate = async () => {
    const state = await getStoredCompatibility();
    if (!state) return await pollCompatibility();
    if (!state.updateReady) return await requestExtensionUpdate(state, true);

    const tabs = await browser.tabs.query({
      url: ['https://hikka.io/*', 'https://dev.hikka.io/*'],
    });
    await browser.storage.local.set({
      [RELOAD_TABS_STORAGE_KEY]: tabs.flatMap((tab) =>
        tab.id === undefined ? [] : [tab.id],
      ),
    });
    browser.runtime.reload();
    return state;
  };

  const reloadTabsAfterUpdate = async () => {
    const stored = await browser.storage.local.get(RELOAD_TABS_STORAGE_KEY);
    const tabIds = stored[RELOAD_TABS_STORAGE_KEY] as number[] | undefined;
    if (!tabIds?.length) return;

    await browser.storage.local.remove(RELOAD_TABS_STORAGE_KEY);
    await Promise.allSettled(tabIds.map((tabId) => browser.tabs.reload(tabId)));
  };

  const ensureCompatibilityAlarm = async () => {
    if (!(await browser.alarms.get(compatibilityAlarm))) {
      await browser.alarms.create(compatibilityAlarm, {
        delayInMinutes: 1,
        periodInMinutes: 60,
      });
    }
  };

  browser.alarms.clear(legacyReleaseNotificationAlarm).catch(console.error);
  ensureCompatibilityAlarm();
  reloadTabsAfterUpdate().catch(console.error);
  pollCompatibility().catch(console.error);
  if (useSettings.getState().convexSession) {
    syncFavoritesFromConvex().catch(console.error);
  }
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === compatibilityAlarm) {
      pollCompatibility().catch(console.error);
    }
  });
  browser.runtime.onUpdateAvailable.addListener(({ version }) => {
    getStoredCompatibility()
      .then((state) =>
        publishCompatibility({
          status: state?.status ?? 'update_available',
          latestVersion: state?.latestVersion ?? version,
          minimumVersion:
            state?.minimumVersion ?? browser.runtime.getManifest().version,
          protocolSupported: state?.protocolSupported ?? true,
          extensionVersion: browser.runtime.getManifest().version,
          updateReady: true,
          checkedAt: state?.checkedAt ?? Date.now(),
          updateCheckedAt: state?.updateCheckedAt ?? Date.now(),
          storeStatus: 'update_available',
        }),
      )
      .catch(console.error);
  });
  browser.tabs.onRemoved.addListener((tabId) => {
    hikkaContentTabs.delete(tabId);
  });

  browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'loading') hikkaContentTabs.delete(tabId);
  });

  browser.runtime.onMessage.addListener(
    async (
      request: unknown,
      sender,
    ): Promise<
      | true
      | LoginResponse
      | ExtensionCompatibilityState
      | { loaded: boolean }
      | RemoteFetchResponse
      | undefined
    > => {
      // Type guard for MessageRequest
      if (!request || typeof request !== 'object' || !('type' in request)) {
        return undefined;
      }

      const typedRequest = request as MessageRequest;
      switch (typedRequest.type) {
        case 'hikka-content-loaded':
          if (sender.tab?.id !== undefined) {
            hikkaContentTabs.add(sender.tab.id);
          }
          return { loaded: true };

        case 'hikka-content-unloaded':
          if (sender.tab?.id !== undefined) {
            hikkaContentTabs.delete(sender.tab.id);
          }
          return { loaded: false };

        case 'hikka-content-status':
          return {
            loaded:
              sender.tab?.id !== undefined &&
              hikkaContentTabs.has(sender.tab.id),
          };

        case 'extension-compatibility-status':
          try {
            return await pollCompatibility();
          } catch (error) {
            const stored = await getStoredCompatibility();
            if (stored) return stored;
            throw error;
          }

        case 'extension-update':
          return await applyExtensionUpdate();

        case 'release-notification-seen':
          if (typeof typedRequest.id !== 'string') return undefined;
          await convexMutation(convexApi.notifications.markSeen, {
            id: typedRequest.id,
          });
          return true;

        case 'login': {
          const redirectUri = browser.identity.getRedirectURL();
          const authorizationUrl = await getHikkaAuthorizationUrl(redirectUri);
          const responseUrl = await browser.identity.launchWebAuthFlow({
            interactive: true,
            url: authorizationUrl,
          });
          if (!responseUrl) throw new Error('Hikka login was cancelled');

          const response = new URL(responseUrl);
          const authError = response.searchParams.get('error');
          const code = response.searchParams.get('code');
          if (authError || !code) {
            throw new Error(authError ?? 'Hikka login did not return a code');
          }
          const auth = await exchangeLoginCode(code);
          await syncFavoritesFromConvex();

          return {
            authenticated: true,
            refreshToken: auth.refreshToken,
            user: auth.user,
          };
        }

        case 'rich-presence-check':
          browser.tabs
            .query({ url: 'https://hikka.io/anime/*-*' })
            .then((tabs) => {
              browser.tabs.sendMessage(sender.tab!.id!, {
                type: 'rich-presence-reply',
                action: typedRequest.action,
                tabs_count: tabs.length,
              });
            });

          return true;

        case 'remote-fetch':
          if (sender.frameId !== 0 || !sender.url || !isHikkaUrl(sender.url)) {
            return undefined;
          }

          return remoteFetch(typedRequest);

        case 'iframe-player-command': {
          browser.tabs.sendMessage(sender.tab!.id!, typedRequest);
          return true;
        }

        default:
          return undefined;
      }
    },
  );
});

const isHikkaUrl = (url: string) => {
  const origin = new URL(url).origin;
  return origin === 'https://hikka.io' || origin === 'https://dev.hikka.io';
};

const remoteFetch = async (
  request: RemoteFetchRequest,
): Promise<RemoteFetchResponse> => {
  const url = new URL(request.url);
  const allowedMethods = REMOTE_FETCH_ORIGINS.get(url.origin);

  if (
    !allowedMethods?.has(request.method) ||
    (request.body?.length ?? 0) > 32_768
  ) {
    throw new Error('Remote fetch is not allowed');
  }

  const headers = new Headers();
  if (url.origin === 'https://manga.in.ua') {
    headers.set('X-Requested-With', 'XMLHttpRequest');
  }
  if (request.method === 'POST') {
    headers.set(
      'Content-Type',
      'application/x-www-form-urlencoded;charset=UTF-8',
    );
  }

  const response = await ky(url, {
    method: request.method,
    headers,
    body: request.method === 'POST' ? request.body : undefined,
    credentials: 'omit',
    throwHttpErrors: false,
  });

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    body: await response.text(),
  };
};

const REMOTE_FETCH_ORIGINS = new Map<string, Set<RemoteFetchRequest['method']>>(
  [
    ['https://manga.in.ua', new Set(['GET', 'POST'])],
    ['https://baka.in.ua', new Set(['GET'])],
  ],
);
