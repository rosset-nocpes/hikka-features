import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import player from '../player';
import MobileEpisodeDrawer from './mobile-episode-drawer';
import MobileTeamProviderDrawer from './mobile-team-provider-drawer';

interface Props {
  toggleWatchedState: (state: boolean) => void;
}

const PlayerMobileToolbar: FC<Props> = ({ toggleWatchedState }) => {
  return (
    <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-2xl bg-secondary/60 p-2 backdrop-blur-xl md:hidden">
      <MobileTeamProviderDrawer toggleWatchedState={toggleWatchedState} />
      <MobileEpisodeDrawer />
      <Button
        variant="secondary"
        size="md"
        onClick={() => player().then((x) => x.remove())}
      >
        <MaterialSymbolsCloseRounded />
      </Button>
    </div>
  );
};

export default PlayerMobileToolbar;
