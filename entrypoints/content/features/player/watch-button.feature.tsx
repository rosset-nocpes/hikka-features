import { useEffect } from 'react';
import MaterialSymbolsSubscriptionsOutlineRounded from '~icons/material-symbols/subscriptions-outline-rounded';

import NavbarAction from '@/components/navbar-action';

import { BaseFeature, createFeatureUi } from '../../core/base-feature';
import { HikkaPages } from '../../core/core.enums';
import { openPlayer } from './player';
import QueueMenu from './queue/queue-menu';

export default class WatchButtonFeature extends BaseFeature {
  readonly id = 'watch-button';
  readonly pages = [HikkaPages.AnimeContent];

  async init() {
    this.ui = await createFeatureUi({
      name: this.id,
      position: 'inline',
      append: 'first',
      anchor: '#navbar-card',
      hostCss: 'margin-right: -0.5rem !important;',
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
  const { data, isLoading, isError } = useWatchData();

  useEffect(() => {
    if (data && slug && opensPlayer(new URLSearchParams(location.search))) {
      openPlayer(data, slug);
    }
  }, [data, slug]);

  return (
    <NavbarAction
      enabled={enabled}
      status={{ isLoading, isError, found: !!data }}
      label="Перегляд"
      icon={
        <MaterialSymbolsSubscriptionsOutlineRounded className="size-full" />
      }
      onClick={() => data && slug && openPlayer(data, slug)}
    >
      {data && slug && (
        <QueueMenu data={data} slug={slug} container={container} />
      )}
    </NavbarAction>
  );
};
