import { useEffect } from 'react';
import MaterialSymbolsSubscriptionsOutlineRounded from '~icons/material-symbols/subscriptions-outline-rounded';

import NavbarAction, { NAVBAR_ACTION_UI } from '@/components/navbar-action';

import { BaseFeature } from '../../core/base-feature';
import { HikkaPages } from '../../core/core.enums';
import { openPlayer } from './player';
import QueueMenu from './queue/queue-menu';

export default class WatchButtonFeature extends BaseFeature {
  readonly id = 'watch-button';
  readonly pages = [HikkaPages.AnimeContent];

  async init() {
    this.ui = await this.createUi({
      ...NAVBAR_ACTION_UI,
      render: (container) => <WatchButton container={container} />,
    });
  }
}

/** Invite and share links open the player as the page loads. */
const opensPlayer = (params: URLSearchParams) =>
  params.has('room') ||
  (params.has('playerProvider') &&
    params.has('playerTeam') &&
    params.has('playerEpisode'));

const WatchButton = ({ container }: { container: HTMLElement }) => {
  const { enabled } = useSettings().features.player;
  const { slug } = usePageStore();
  const query = useWatchData();
  // The backend answers with no teams when no site has the anime.
  const data = query.data?.teams.length ? query.data : undefined;

  useEffect(() => {
    if (data && slug && opensPlayer(new URLSearchParams(location.search))) {
      openPlayer(data, slug);
    }
  }, [data, slug]);

  return (
    <NavbarAction
      enabled={enabled}
      status={{ isLoading: query.isLoading, found: !!data }}
      label="Перегляд"
      icon={
        <MaterialSymbolsSubscriptionsOutlineRounded className="size-full" />
      }
      onClick={() => data && slug && openPlayer(data, slug)}
      menu={
        data &&
        slug && <QueueMenu data={data} slug={slug} container={container} />
      }
    />
  );
};
