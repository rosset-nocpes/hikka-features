import { useSettings } from '@/hooks/use-settings';

import { type CatalogTeam, convexApi, type TeamPriority } from './convex-api';
import { accountMutation, accountQuery } from './convex-client';

export interface TeamPriorityAccount {
  get: () => Promise<TeamPriority | null>;
  set: (teamIds: string[]) => Promise<TeamPriority>;
}

const sameOrder = (left: CatalogTeam[], right: CatalogTeam[]) =>
  left.length === right.length &&
  left.every((team, index) => team.id === right[index]?.id);

/**
 * Reconciles the local team priority with the account. A device's first sync
 * keeps the account's order and appends local-only teams. After that, a list
 * changed on another device replaces the local one, and local edits are
 * pushed while the account still holds what this device last synced.
 */
export async function syncTeamPriority(account: TeamPriorityAccount) {
  const { convexSession, teamPrioritySyncedAt, features } =
    useSettings.getState();
  if (!convexSession) return;

  const local = features.player.teamPriority;
  const remote = await account.get();

  let push: CatalogTeam[] | undefined;
  if (!remote) {
    if (local.length) push = local;
  } else if (!teamPrioritySyncedAt) {
    const synced = new Set(remote.teams.map((team) => team.id));
    const merged = [
      ...remote.teams,
      ...local.filter((team) => !synced.has(team.id)),
    ];
    if (!sameOrder(merged, remote.teams)) push = merged;
  } else if (
    remote.updatedAt === teamPrioritySyncedAt &&
    !sameOrder(local, remote.teams)
  ) {
    push = local;
  }

  const saved = push ? await account.set(push.map((team) => team.id)) : remote;
  if (!saved) return;

  // An edit made while this ran is kept; the next sync pushes it.
  const state = useSettings.getState();
  const edited = state.features.player.teamPriority !== local;
  state.setSettings({
    teamPrioritySyncedAt: saved.updatedAt,
    ...(edited
      ? {}
      : {
          features: {
            ...state.features,
            player: { ...state.features.player, teamPriority: saved.teams },
          },
        }),
  });
}

let queue = Promise.resolve();

/**
 * Syncs from an extension page through the background. Runs are queued, so a
 * pull never interleaves with the push of a later edit.
 */
export function queueTeamPrioritySync() {
  queue = queue
    .then(() =>
      syncTeamPriority({
        get: () => accountQuery(convexApi.teamPriority.get, {}),
        set: (teamIds) =>
          accountMutation(convexApi.teamPriority.set, { teamIds }),
      }),
    )
    .catch(console.error);
  return queue;
}
