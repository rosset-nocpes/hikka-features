import { AnimatePresence, motion } from 'motion/react';
import MaterialSymbolsPlayArrowRounded from '~icons/material-symbols/play-arrow-rounded';

import { useIFramePlayer } from '@/hooks/use-iframe-player';

import { usePlayer } from '../context/player-context';
import { dispatchPlayerOverlayAction } from '../player-overlay/action-popup';
import { selectionKey, selectionOf } from './room';
import { useWatchTogether } from './use-watch-together';

/**
 * The room plays, but the browser wouldn't start the player without the
 * user's click, as it does with sound on a page opened from an invite. The
 * player waits meanwhile; the click plays it from where the room is.
 */
const RoomCatchUp = () => {
  const shown = useIFramePlayer(
    (state) =>
      state.isReady &&
      state.playBlocked &&
      !state.isPlaying &&
      !state.adInProgress,
  );
  // The room plays its episode, and the player has it, not still loading.
  const roomKey = useWatchTogether(({ room }) =>
    room?.playing ? selectionKey(room) : undefined,
  );
  const playerKey = usePlayer((player) => {
    const selection = selectionOf(player);
    return selection && selectionKey(selection);
  });

  const catchUp = () => {
    useIFramePlayer.getState().play();
    dispatchPlayerOverlayAction(usePlayer.getState().overlay, { type: 'play' });
  };

  return (
    <AnimatePresence>
      {shown && roomKey !== undefined && roomKey === playerKey && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center p-4"
        >
          <button
            type="button"
            // Holding it mustn't speed the video up.
            data-player-controls
            onClick={catchUp}
            className="player-glass text-foreground hover:bg-muted focus-visible:ring-ring/50 pointer-events-auto flex max-w-64 cursor-pointer flex-col items-center gap-1 rounded-xl border px-5 py-4 text-center shadow-lg transition-colors outline-none focus-visible:ring-3"
          >
            <span className="bg-foreground text-background mb-1 flex size-12 items-center justify-center rounded-full">
              <MaterialSymbolsPlayArrowRounded className="size-7" />
            </span>
            <span className="text-sm font-semibold">Наздогнати кімнату</span>
            <span className="text-muted-foreground text-xs text-pretty">
              Браузер не вмикає відео зі звуком без вашого натискання
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RoomCatchUp;
