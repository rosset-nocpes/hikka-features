import ky from 'ky';

import type { IFramePlayerCommand } from '@/integrations/iframe-player/protocol';
import type {
  RemoteFetchRequest,
  RemoteFetchResponse,
} from '@/utils/remote-fetch';

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

interface PlayerInfo {
  playerProvider: string;
  teamName: string;
  episodeNumber: number;
}

interface WatchTogetherRequestHost extends WatchTogetherRequest {
  animeSlug: string;
  playerInfo: PlayerInfo;
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
          const { setSettings } = useSettings.getState();

          const auth_url = `https://hikka.io/oauth/?reference=${CLIENT_REFERENCE}&scope=${encodeURIComponent(
            NEEDED_SCOPES.join(','),
          )}`;

          browser.identity
            .launchWebAuthFlow({
              interactive: true,
              url: auth_url,
            })
            .then(async (response_url) => {
              const params = new URLSearchParams(response_url?.split('?')[1]);

              setSettings({
                hikkaSecret: {
                  secret: params.get('secret')!,
                  expiration: Number(params.get('expiration')),
                },
              });

              const r = await getUserData();
              if (!r) return;

              setSettings({
                userData: {
                  hikkaId: r.reference,
                  username: r.username,
                  avatar: r.avatar,
                },
              });
            })
            .finally(() => {
              if (import.meta.env.BROWSER === 'firefox') return;

              void browser.permissions.remove({
                permissions: ['identity'],
                origins: ['https://api.hikka.io/*'],
              });
            });

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
