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
} from '@/utils/compatibility';
import { convexApi } from '@/utils/convex-api';
import {
  type ConvexAuthRequest,
  type ConvexTokenRequest,
  convexClient,
} from '@/utils/convex-client';
import {
  accountToken,
  login,
  logout,
  runAccountRequest,
  syncAccountTeamPriority,
  syncFavorites,
} from '@/utils/convex-session';

interface LoginRequest {
  type: 'login';
}

interface LogoutRequest {
  type: 'logout';
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

type MessageRequest =
  | LoginRequest
  | LogoutRequest
  | ConvexAuthRequest
  | ConvexTokenRequest
  | RemoteFetchRequest
  | IFramePlayerCommand
  | HikkaContentLoadedRequest
  | HikkaContentUnloadedRequest
  | HikkaContentStatusRequest;

export default defineBackground(() => {
  const hikkaContentTabs = new Set<number>();
  const compatibilityAlarm = 'extension-compatibility';

  /** Stored so API calls stop once the backend drops this version. */
  const pollCompatibility = async () => {
    const extensionVersion = browser.runtime.getManifest().version;
    const compatibility = await convexClient().query(
      convexApi.compatibility.get,
      { extensionVersion, protocol: EXTENSION_API_PROTOCOL },
    );
    await browser.storage.local.set({
      [COMPATIBILITY_STORAGE_KEY]: {
        ...compatibility,
        extensionVersion,
        checkedAt: Date.now(),
      } satisfies ExtensionCompatibilityState,
    });
  };

  const ensureCompatibilityAlarm = async () => {
    if (!(await browser.alarms.get(compatibilityAlarm))) {
      await browser.alarms.create(compatibilityAlarm, {
        delayInMinutes: 1,
        periodInMinutes: 60,
      });
    }
  };

  const syncAccount = () => {
    syncFavorites().catch(console.error);
    syncAccountTeamPriority().catch(console.error);
  };

  ensureCompatibilityAlarm();
  pollCompatibility().catch(console.error);
  browser.runtime.onStartup.addListener(syncAccount);
  // Updates and reloads skip onStartup.
  browser.runtime.onInstalled.addListener(syncAccount);
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === compatibilityAlarm) {
      pollCompatibility().catch(console.error);
      // Also retries a failed upload, which release notifications depend on.
      syncAccountTeamPriority().catch(console.error);
    }
  });
  browser.tabs.onRemoved.addListener((tabId) => {
    hikkaContentTabs.delete(tabId);
  });

  browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'loading') hikkaContentTabs.delete(tabId);
  });

  browser.runtime.onMessage.addListener(
    async (request: unknown, sender): Promise<unknown> => {
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

        case 'convex-auth':
          return await runAccountRequest(typedRequest);

        case 'convex-token':
          // Only the player on hikka.io keeps a live connection.
          if (sender.frameId !== 0 || !sender.url || !isHikkaUrl(sender.url)) {
            return null;
          }

          return await accountToken(typedRequest.forceRefresh);

        case 'login': {
          const user = await login();
          syncAccount();
          return user;
        }

        case 'logout':
          await logout();
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
