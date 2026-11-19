import { StoredValue } from './stored-value';

type LoginState =
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
 * The hikka.io login in progress, or why the last one failed; gone once it
 * succeeded. It lives in `storage.local` so it outlasts Chrome restarting
 * the background's worker, and so every context can wait for the login.
 */
export const loginState = new StoredValue<LoginState>('account-login');

/**
 * Runs `start`, which asks the background to log in, and settles once that
 * login ends. Fails with the backend's or the background's error code.
 */
export function awaitLogin(start: () => Promise<unknown>) {
  return new Promise<void>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const settle = (error?: unknown) => {
      unwatch();
      clearTimeout(timer);
      if (error === undefined) resolve();
      else reject(error instanceof Error ? error : new Error(String(error)));
    };

    const unwatch = loginState.watch((state) => {
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
    });

    start().catch(settle);
  });
}
