/** URL parameters of share and invite links, removed once read. */
const LINK_PARAMS = [
  'playerProvider',
  'playerTeam',
  'playerEpisode',
  'time',
  'room',
  'join',
];

export interface SharedPlayerParams {
  provider: string | null;
  team: string | null;
  episode: string | null;
  time: string | null;
}

/** Reads the page's share or invite link, then takes it off the URL. */
export const takeLinkParams = () => {
  const params = new URLSearchParams(window.location.search);
  const sharedParams: SharedPlayerParams = {
    provider: params.get('playerProvider'),
    team: params.get('playerTeam'),
    episode: params.get('playerEpisode'),
    time: params.get('time'),
  };

  const url = new URL(window.location.href);
  LINK_PARAMS.forEach((param) => url.searchParams.delete(param));
  history.replaceState(history.state, '', url.href);

  return {
    sharedParams,
    isShared:
      !!sharedParams.provider && !!sharedParams.team && !!sharedParams.episode,
    /** Watch together room code from an invite link. */
    roomInvite: params.get('room') ?? undefined,
    /** The invite was accepted before the page opened, e.g. from a toast. */
    roomInviteAccepted: params.has('join'),
  };
};
