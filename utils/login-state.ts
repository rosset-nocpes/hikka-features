/**
 * The hikka.io login in progress, or why the last one failed; gone once it
 * succeeded. It lives in `storage.local` so it outlasts Chrome restarting
 * the background's worker, and so every context can wait for the login.
 */
export const LOGIN_STATE_KEY = 'account-login';

export type LoginState =
  | {
      status: 'pending';
      /** Proves to the backend that this install started the login. */
      verifier: string;
      /** The login tab, and the tab to return to once it's done. */
      tabId: number;
      openerTabId?: number;
      expiresAt: number;
    }
  | { status: 'failed'; error: string };

/**
 * Runs `start`, which asks the background to log in, and settles once that
 * login ends. Fails with the backend's or the background's error code.
 */
export function awaitLogin(start: () => Promise<unknown>) {
  return new Promise<void>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const settle = (error?: unknown) => {
      browser.storage.onChanged.removeListener(onChanged);
      clearTimeout(timer);
      if (error === undefined) resolve();
      else reject(error instanceof Error ? error : new Error(String(error)));
    };

    const onChanged = (
      changes: Record<string, Browser.storage.StorageChange>,
      area: string,
    ) => {
      if (area !== 'local' || !(LOGIN_STATE_KEY in changes)) return;
      const state = changes[LOGIN_STATE_KEY]!.newValue as
        | LoginState
        | undefined;
      if (state?.status === 'pending') {
        // A tab left open past the backend's limit can't log in anymore.
        clearTimeout(timer);
        timer = setTimeout(
          () => settle('login_expired'),
          state.expiresAt - Date.now(),
        );
        return;
      }
      settle(state?.error);
    };

    browser.storage.onChanged.addListener(onChanged);
    start().catch(settle);
  });
}
