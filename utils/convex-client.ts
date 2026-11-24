import { ConvexHttpClient } from 'convex/browser';
import {
  type FunctionReference,
  type FunctionReturnType,
  getFunctionName,
} from 'convex/server';
import { ConvexError } from 'convex/values';

import { RECHECK_INTERVAL } from '@/constants/account';
import {
  compatibilityState,
  currentCompatibility,
  EXTENSION_API_PROTOCOL,
} from '@/utils/compatibility';
import { convexApi } from '@/utils/convex-api';
import { sendToBackground } from '@/utils/messaging';

const CONVEX_URL = import.meta.env.WXT_CONVEX_URL ?? '';
export const CONVEX_SITE_URL = import.meta.env.WXT_CONVEX_SITE_URL ?? '';

export const requireConvexUrl = () => {
  if (!CONVEX_URL) throw new Error('WXT_CONVEX_URL is not configured');
  return CONVEX_URL;
};

/**
 * The backend over HTTP. Public calls go straight to it; account calls go
 * through the background, which owns the session. Refresh tokens rotate on
 * use, so letting every tab refresh on its own would race.
 */
class Convex {
  private publicClient?: ConvexHttpClient;
  private lastRecheck = 0;
  private rechecking?: Promise<void>;

  /** A client of its own, e.g. for one account call's token. */
  createClient() {
    return new ConvexHttpClient(requireConvexUrl());
  }

  /** Asks the backend whether it still serves this build, and stores it. */
  async refreshCompatibility() {
    const extensionVersion = browser.runtime.getManifest().version;
    const compatibility = await this.createClient().query(
      convexApi.compatibility.get,
      { extensionVersion, protocol: EXTENSION_API_PROTOCOL },
    );
    await compatibilityState.set({
      ...compatibility,
      extensionVersion,
      checkedAt: Date.now(),
    });
  }

  /**
   * Rethrows a failed call's error, as `EXTENSION_UPDATE_REQUIRED` when the
   * backend has dropped this build since the last check. A backend that
   * changed under an old build fails with plain errors (a missing function,
   * rejected arguments), so those recheck, at most once a minute.
   */
  async explainFailure(error: unknown): Promise<never> {
    if (!(error instanceof ConvexError)) {
      if (Date.now() - this.lastRecheck > RECHECK_INTERVAL) {
        this.lastRecheck = Date.now();
        this.rechecking ??= this.refreshCompatibility()
          .catch(console.error)
          .finally(() => {
            this.rechecking = undefined;
          });
      }
      await this.rechecking;
      await this.assertCompatible();
    }
    throw error;
  }

  /** Stops API calls once the backend reports this build as unsupported. */
  async assertCompatible() {
    if ((await currentCompatibility())?.status === 'unsupported') {
      throw new Error('EXTENSION_UPDATE_REQUIRED');
    }
  }

  async query<Query extends FunctionReference<'query'>>(
    query: Query,
    args: Query['_args'],
  ): Promise<FunctionReturnType<Query>> {
    await this.assertCompatible();
    return await this.public()
      .query(query, args)
      .catch((error) => this.explainFailure(error));
  }

  /** `skipQueue`: not behind this tab's other mutations, which may be stuck. */
  async mutation<Mutation extends FunctionReference<'mutation'>>(
    mutation: Mutation,
    args: Mutation['_args'],
    options?: { skipQueue: boolean },
  ): Promise<FunctionReturnType<Mutation>> {
    await this.assertCompatible();
    return await this.public()
      .mutation(mutation, args, options)
      .catch((error) => this.explainFailure(error));
  }

  async action<Action extends FunctionReference<'action'>>(
    action: Action,
    args: Action['_args'],
  ): Promise<FunctionReturnType<Action>> {
    await this.assertCompatible();
    return await this.public()
      .action(action, args)
      .catch((error) => this.explainFailure(error));
  }

  async accountQuery<Query extends FunctionReference<'query'>>(
    query: Query,
    args: Query['_args'],
  ): Promise<FunctionReturnType<Query>> {
    return await sendToBackground('convex-auth', {
      kind: 'query',
      name: getFunctionName(query),
      args,
    });
  }

  async accountMutation<Mutation extends FunctionReference<'mutation'>>(
    mutation: Mutation,
    args: Mutation['_args'],
  ): Promise<FunctionReturnType<Mutation>> {
    return await sendToBackground('convex-auth', {
      kind: 'mutation',
      name: getFunctionName(mutation),
      args,
    });
  }

  private public() {
    return (this.publicClient ??= this.createClient());
  }
}

export const convex = new Convex();
