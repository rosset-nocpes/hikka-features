import { useEffect } from 'react';
import MaterialSymbolsSubscriptionsOutlineRounded from '~icons/material-symbols/subscriptions-outline-rounded';

import NavbarAction from '@/components/navbar-action';

import { BaseFeature, createFeatureUi } from '../../core/base-feature';
import { HikkaPages } from '../../core/core.enums';
import { openPlayer } from './player';

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
      render: () => <WatchButton />,
    });
  }
}

/** Invite and share links open the player as the page loads. */
const opensPlayer = (params: URLSearchParams) =>
  params.has('room') ||
  (params.has('playerProvider') &&
    params.has('playerTeam') &&
    params.has('playerEpisode'));

const WatchButton = () => {
  const { enabled } = useSettings().features.player;
  const { data, isLoading, isError } = useWatchData();

  useEffect(() => {
    if (data && opensPlayer(new URLSearchParams(location.search))) {
      openPlayer(data);
    }
  }, [data]);

  return (
    <NavbarAction
      enabled={enabled}
      status={{ isLoading, isError, found: !!data }}
      label="Перегляд"
      icon={
        <MaterialSymbolsSubscriptionsOutlineRounded className="size-full" />
      }
      onClick={() => data && openPlayer(data)}
    />
  );
};
