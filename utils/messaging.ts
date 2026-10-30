import type { IFramePlayerCommandPayload } from '@/integrations/iframe-player/protocol';

export interface RemoteFetchResponse {
  ok: boolean;
  status: number;
  statusText: string;
  body: string;
}

/**
 * The messages the background answers: each takes its payload and returns
 * the reply. The background owns the session and the cross-origin fetches.
 */
export interface BackgroundMessages {
  /** Opens the hikka.io login tab; `awaitLogin` waits for it to end. */
  login(): void;
  logout(): void;
  /** Who hikka.io is signed in as (null: nobody), for the account to follow. */
  'hikka-viewer'(request: { viewerId: string | null }): void;
  /** An account-scoped Convex call, made with the background's session. */
  'convex-auth'(request: {
    kind: 'query' | 'mutation';
    name: string;
    args: Record<string, unknown>;
  }): unknown;
  /** An access token for a tab's live connection, or null when signed out. */
  'convex-token'(request: { forceRefresh: boolean }): string | null;
  /** A fetch on a reader site, which the page's origin couldn't make. */
  'remote-fetch'(request: {
    url: string;
    method: 'GET' | 'POST';
    body?: string;
  }): RemoteFetchResponse;
  /** Passed on to the episode's player frame in the sender's tab. */
  'iframe-player-command'(command: IFramePlayerCommandPayload): true;
  'hikka-content-loaded'(): void;
  'hikka-content-unloaded'(): void;
  /** Whether hikka.io's content script runs in the sender's tab. */
  'hikka-content-status'(): boolean;
}

export type BackgroundMessageType = keyof BackgroundMessages;

type Payload<T extends BackgroundMessageType> = Parameters<
  BackgroundMessages[T]
>;

export type BackgroundMessage<
  T extends BackgroundMessageType = BackgroundMessageType,
> = {
  [K in T]: { type: K } & (Payload<K> extends [infer P] ? P : unknown);
}[T];

export type BackgroundReply<T extends BackgroundMessageType> = ReturnType<
  BackgroundMessages[T]
>;

/** Asks the background, which answers through its `BackgroundHandlers`. */
export const sendToBackground = <T extends BackgroundMessageType>(
  type: T,
  ...[payload]: Payload<T>
) =>
  browser.runtime.sendMessage({ type, ...payload }) as Promise<
    BackgroundReply<T>
  >;

export type BackgroundHandlers = {
  [K in BackgroundMessageType]: (
    message: BackgroundMessage<K>,
    sender: Browser.runtime.MessageSender,
  ) => BackgroundReply<K> | Promise<BackgroundReply<K>>;
};

export const isBackgroundMessage = (
  message: unknown,
  handlers: BackgroundHandlers,
): message is BackgroundMessage =>
  !!message &&
  typeof message === 'object' &&
  'type' in message &&
  typeof message.type === 'string' &&
  Object.hasOwn(handlers, message.type);
