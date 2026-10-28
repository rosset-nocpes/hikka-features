import { useSettings } from '@/hooks/use-settings';

import type {
  CatalogTeam,
  PreferredTranslation,
  TeamPriority,
} from './convex-api';

interface TeamPriorityInput {
  teamIds: string[];
  translationType: PreferredTranslation;
}

export interface TeamPriorityAccount {
  get: () => Promise<TeamPriority | null>;
  set: (input: TeamPriorityInput) => Promise<TeamPriority>;
}

const sameOrder = (left: CatalogTeam[], right: CatalogTeam[]) =>
  left.length === right.length &&
  left.every((team, index) => team.id === right[index]?.id);

const toInput = (
  teams: CatalogTeam[],
  translationType: PreferredTranslation,
): TeamPriorityInput => ({
  teamIds: teams.map((team) => team.id),
  translationType,
});

/**
 * Reconciles the local team priority and its translation with the account. A
 * device's first sync keeps the account's order and translation and appends
 * local-only teams. After that, a list changed on another device replaces the
 * local one, and local edits are pushed while the account still holds what
 * this device last synced.
 */
export async function syncTeamPriority(account: TeamPriorityAccount) {
  const { convexSession, teamPrioritySyncedAt, features } =
    useSettings.getState();
  if (!convexSession) return;

  const local = features.player.teamPriority;
  const localTranslation = features.player.teamPriorityTranslation;
  const remote = await account.get();

  let push: TeamPriorityInput | undefined;
  if (!remote) {
    if (local.length || localTranslation !== 'dub') {
      push = toInput(local, localTranslation);
    }
  } else if (!teamPrioritySyncedAt) {
    const synced = new Set(remote.teams.map((team) => team.id));
    const merged = [
      ...remote.teams,
      ...local.filter((team) => !synced.has(team.id)),
    ];
    if (!sameOrder(merged, remote.teams)) {
      push = toInput(merged, remote.translationType);
    }
  } else if (
    remote.updatedAt === teamPrioritySyncedAt &&
    (!sameOrder(local, remote.teams) ||
      localTranslation !== remote.translationType)
  ) {
    push = toInput(local, localTranslation);
  }

  const saved = push ? await account.set(push) : remote;
  if (!saved) return;

  // An edit made while this ran is kept; the next sync pushes it.
  const state = useSettings.getState();
  const { player } = state.features;
  const edited =
    player.teamPriority !== local ||
    player.teamPriorityTranslation !== localTranslation;
  state.setSettings({
    teamPrioritySyncedAt: saved.updatedAt,
    ...(edited
      ? {}
      : {
          features: {
            ...state.features,
            player: {
              ...player,
              teamPriority: saved.teams,
              teamPriorityTranslation: saved.translationType,
            },
          },
        }),
  });
}
