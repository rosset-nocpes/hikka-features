import { useEffect } from 'react';

import { SeekBar, type SeekBarLayout } from '@/components/media/seek-bar';

import { compactMode, usePlayer } from '../../context/player-context';

/** The video's seek bar, in the player's toolbar or bar. */
const Time = (props: SeekBarLayout = {}) => {
  const { currentTime, duration, seek, bufferedTime, checkBuffering } =
    useIFramePlayer();
  const overlay = usePlayer((state) => state.overlay);
  const isCompact = usePlayer(compactMode);

  useEffect(() => {
    checkBuffering();
  }, [checkBuffering, currentTime]);

  return (
    <SeekBar
      {...props}
      currentTime={currentTime}
      duration={duration}
      bufferedTime={bufferedTime}
      seek={seek}
      compact={isCompact}
      overlay={overlay}
    />
  );
};

export default Time;
