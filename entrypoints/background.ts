import ky from 'ky';

import type { IFramePlayerCommand } from '@/integrations/iframe-player/protocol';
import type {
  RemoteFetchRequest,
  RemoteFetchResponse,
} from '@/utils/remote-fetch';

import { convexApi } from '@/utils/convex-api';
import {
  CONVEX_SITE_URL,
  convexMutation,
  convexQuery,
  exchangeLoginCode,
} from '@/utils/convex-client';
import { syncFavoritesFromConvex } from '@/utils/favorite-sync';

interface LoginRequest {
  type: 'login';
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

type MessageRequest =
  | LoginRequest
  | RichPresenceCheckRequest
  | WatchTogetherRequest
  | RemoteFetchRequest
  | IFramePlayerCommand
  | HikkaContentLoadedRequest
  | HikkaContentUnloadedRequest
  | HikkaContentStatusRequest;

export default defineBackground(() => {
  const hikkaContentTabs = new Set<number>();
  const notificationAlarm = 'release-notifications';

  const ensureNotificationAlarm = async () => {
    if (!(await browser.alarms.get(notificationAlarm))) {
      await browser.alarms.create(notificationAlarm, {
        delayInMinutes: 1,
        periodInMinutes: 5,
      });
    }
  };

  const pollReleaseNotifications = async () => {
    if (!useSettings.getState().convexSession) return;
    const notifications = await convexQuery(convexApi.notifications.unread, {
      limit: 25,
    });
    if (!notifications.length) return;

    const targets = (await browser.storage.local.get('notificationTargets'))
      .notificationTargets as Record<string, string> | undefined;
    const updatedTargets = { ...targets };
    const delivered: string[] = [];

    for (const notification of notifications) {
      const id = `release:${notification.id}`;
      await browser.notifications.create(id, {
        type: 'basic',
        iconUrl: '/hikka-features-small.svg',
        title: `${notification.teamTitle}: серія ${notification.episodeNumber}`,
        message:
          notification.episodeTitle ??
          `Вийшла нова серія для ${notification.teamTitle}`,
      });
      updatedTargets[id] = notification.animeSlug;
      delivered.push(notification.id);
    }

    await browser.storage.local.set({
      notificationTargets: updatedTargets,
    });
    await convexMutation(convexApi.notifications.markDelivered, {
      ids: delivered,
    });
  };

  ensureNotificationAlarm();
  if (useSettings.getState().convexSession) {
    syncFavoritesFromConvex()
      .then(pollReleaseNotifications)
      .catch(console.error);
  }
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === notificationAlarm) {
      pollReleaseNotifications().catch(console.error);
    }
  });
  browser.notifications.onClicked.addListener(async (notificationId) => {
    if (!notificationId.startsWith('release:')) return;
    const stored = await browser.storage.local.get('notificationTargets');
    const targets = (stored.notificationTargets ?? {}) as Record<
      string,
      string
    >;
    const slug = targets[notificationId];
    if (slug) {
      await browser.tabs.create({ url: `https://hikka.io/anime/${slug}` });
    }
    await convexMutation(convexApi.notifications.markRead, {
      id: notificationId.slice('release:'.length),
    }).catch(console.error);
    delete targets[notificationId];
    await browser.storage.local.set({ notificationTargets: targets });
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
      true | { loaded: boolean } | RemoteFetchResponse | undefined
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

        case 'login': {
          if (!CONVEX_SITE_URL) {
            throw new Error('WXT_CONVEX_SITE_URL is not configured');
          }
          const redirectUri = browser.identity.getRedirectURL();
          const authUrl = new URL(`${CONVEX_SITE_URL}/auth/hikka/start`);
          authUrl.searchParams.set('redirect_uri', redirectUri);
          const responseUrl = await browser.identity.launchWebAuthFlow({
            interactive: true,
            url: authUrl.toString(),
          });
          if (!responseUrl) throw new Error('Hikka login was cancelled');

          const response = new URL(responseUrl);
          const authError = response.searchParams.get('error');
          const code = response.searchParams.get('code');
          if (authError || !code) {
            throw new Error(authError ?? 'Hikka login did not return a code');
          }
          await exchangeLoginCode(code);
          await syncFavoritesFromConvex();
          await pollReleaseNotifications();

          return true;
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
