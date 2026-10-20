import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';

import { Button } from '@/components/ui/button';

import { closePlayer } from '../player';
import MobileEpisodeDrawer from './mobile-episode-drawer';
import MobileTeamProviderDrawer from './mobile-team-provider-drawer';

const PlayerMobileToolbar = () => (
  <div className="bg-secondary/60 absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-2xl p-2 backdrop-blur-xl md:hidden">
    <MobileTeamProviderDrawer />
    <MobileEpisodeDrawer />
    <Button variant="secondary" size="md" onClick={closePlayer}>
      <MaterialSymbolsCloseRounded />
    </Button>
  </div>
);

export default PlayerMobileToolbar;
