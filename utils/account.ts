import { useSettings } from '@/hooks/use-settings';

import { convexApi, type TranslationType } from './convex-api';
import { convex, liveConvex } from './convex-client';
import { sendToBackground } from './messaging';
import { syncTeamPriority } from './team-priority-sync';

/**
 * The user's extension account as tabs and the popup see it. The background
 * holds the session; this asks it and waits for the settings it saves.
 */
class Account {
  private teamPrioritySync = Promise.resolve();

  get signedIn() {
    return !!useSettings.getState().convexSession;
  }

  async login() {
    const user = await sendToBackground('login');
    if (!user) throw new Error('Не вдалося завершити вхід через hikka.io');
    await useSettings.persist.rehydrate();
    return user;
  }

  async logout() {
    await sendToBackground('logout');
    await useSettings.persist.rehydrate();
  }

  /** Mirrors a favorite team to the account, when signed in. */
  async saveFavorite(input: {
    animeSlug: string;
    provider: string;
    teamId?: string;
    teamTitle: string;
    translationType?: TranslationType;
  }) {
    if (!this.signedIn) return;
    await convex.accountMutation(convexApi.favorites.set, {
      favorite: {
        ...input,
        translationType: input.translationType ?? 'unknown',
        notificationsEnabled: true,
      },
    });
  }

  async removeFavorite(animeSlug: string) {
    if (!this.signedIn) return;
    await convex.accountMutation(convexApi.favorites.remove, { animeSlug });
  }

  /**
   * Syncs the team priority. Runs are queued, so a pull never interleaves
   * with the push of a later edit.
   */
  syncTeamPriority() {
    this.teamPrioritySync = this.teamPrioritySync
      .then(() =>
        syncTeamPriority({
          get: () => convex.accountQuery(convexApi.teamPriority.get, {}),
          set: (input) =>
            convex.accountMutation(convexApi.teamPriority.set, input),
        }),
      )
      .catch(console.error);
    return this.teamPrioritySync;
  }

  /** Reads the user's mutual follows again; the server limits how often. */
  refreshFriends() {
    return liveConvex
      .action(convexApi.friends.refresh, {})
      .catch(console.error);
  }
}

export const account = new Account();
