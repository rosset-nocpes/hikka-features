import ky from 'ky';

import {
  COMPATIBILITY_STORAGE_KEY,
  EXTENSION_API_PROTOCOL,
  type ExtensionCompatibilityState,
} from '@/utils/compatibility';
import { convexApi } from '@/utils/convex-api';
import { convex } from '@/utils/convex-client';
import { accountSession } from '@/utils/convex-session';
import {
  type BackgroundHandlers,
  type BackgroundMessage,
  isBackgroundMessage,
  type RemoteFetchResponse,
} from '@/utils/messaging';

const COMPATIBILITY_ALARM = 'extension-compatibility';

/** Origins the reader reads from, with the methods it uses there. */
const REMOTE_FETCH_ORIGINS = new Map<
  string,
  Set<BackgroundMessage<'remote-fetch'>['method']>
>([
  ['https://manga.in.ua', new Set(['GET', 'POST'])],
  ['https://baka.in.ua', new Set(['GET'])],
]);

export default defineBackground(() => {
  const hikkaContentTabs = new Set<number>();

  const syncAccount = () => void accountSession.sync();

  const handlers: BackgroundHandlers = {
    'hikka-content-loaded': (_, sender) => {
      if (sender.tab?.id !== undefined) hikkaContentTabs.add(sender.tab.id);
    },
    'hikka-content-unloaded': (_, sender) => {
      if (sender.tab?.id !== undefined) hikkaContentTabs.delete(sender.tab.id);
    },
    'hikka-content-status': (_, sender) =>
      sender.tab?.id !== undefined && hikkaContentTabs.has(sender.tab.id),
    'convex-auth': (request) => accountSession.run(request),
    // Only the player on hikka.io keeps a live connection.
    'convex-token': ({ forceRefresh }, sender) =>
      fromHikkaPage(sender) ? accountSession.lendToken(forceRefresh) : null,
    login: async () => {
      const user = await accountSession.login();
      syncAccount();
      return user;
    },
    logout: () => accountSession.logout(),
    'remote-fetch': (request, sender) => {
      if (!fromHikkaPage(sender))
        throw new Error('Remote fetch is not allowed');
      return remoteFetch(request);
    },
    'iframe-player-command': (command, sender) => {
      void browser.tabs.sendMessage(sender.tab!.id!, command);
      return true;
    },
  };

  browser.runtime.onMessage.addListener((message: unknown, sender) => {
    if (!isBackgroundMessage(message, handlers)) return undefined;
    const handle = handlers[message.type] as (
      message: BackgroundMessage,
      sender: Browser.runtime.MessageSender,
    ) => unknown;
    return (async () => await handle(message, sender))();
  });

  void ensureCompatibilityAlarm();
  pollCompatibility().catch(console.error);
  browser.runtime.onStartup.addListener(syncAccount);
  // Updates and reloads skip onStartup.
  browser.runtime.onInstalled.addListener(syncAccount);
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== COMPATIBILITY_ALARM) return;
    pollCompatibility().catch(console.error);
    // Also retries a failed upload, which release notifications depend on.
    accountSession.syncTeamPriority().catch(console.error);
  });
  browser.tabs.onRemoved.addListener((tabId) => {
    hikkaContentTabs.delete(tabId);
  });
  browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'loading') hikkaContentTabs.delete(tabId);
  });
});

/** Stored so API calls stop once the backend drops this version. */
async function pollCompatibility() {
  const extensionVersion = browser.runtime.getManifest().version;
  const compatibility = await convex
    .createClient()
    .query(convexApi.compatibility.get, {
      extensionVersion,
      protocol: EXTENSION_API_PROTOCOL,
    });
  await browser.storage.local.set({
    [COMPATIBILITY_STORAGE_KEY]: {
      ...compatibility,
      extensionVersion,
      checkedAt: Date.now(),
    } satisfies ExtensionCompatibilityState,
  });
}

async function ensureCompatibilityAlarm() {
  if (!(await browser.alarms.get(COMPATIBILITY_ALARM))) {
    await browser.alarms.create(COMPATIBILITY_ALARM, {
      delayInMinutes: 1,
      periodInMinutes: 60,
    });
  }
}

/** Whether the message comes from hikka.io's page, not one of its frames. */
function fromHikkaPage(sender: Browser.runtime.MessageSender) {
  if (sender.frameId !== 0 || !sender.url) return false;
  const { origin } = new URL(sender.url);
  return origin === 'https://hikka.io' || origin === 'https://dev.hikka.io';
}

async function remoteFetch(
  request: BackgroundMessage<'remote-fetch'>,
): Promise<RemoteFetchResponse> {
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
}
