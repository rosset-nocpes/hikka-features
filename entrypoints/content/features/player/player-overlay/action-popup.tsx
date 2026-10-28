import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import MaterialSymbolsFastForwardOutlineRounded from '~icons/material-symbols/fast-forward-outline-rounded';
import MaterialSymbolsFastRewindOutlineRounded from '~icons/material-symbols/fast-rewind-outline-rounded';
import MaterialSymbolsPauseOutlineRounded from '~icons/material-symbols/pause-outline-rounded';
import MaterialSymbolsPlayArrowOutlineRounded from '~icons/material-symbols/play-arrow-outline-rounded';
import MaterialSymbolsVolumeDownOutlineRounded from '~icons/material-symbols/volume-down-outline-rounded';
import MaterialSymbolsVolumeOffOutlineRounded from '~icons/material-symbols/volume-off-outline-rounded';
import MaterialSymbolsVolumeUpOutlineRounded from '~icons/material-symbols/volume-up-outline-rounded';

import { usePlayer } from '../context/player-context';

export const PLAYER_OVERLAY_ACTION_EVENT = 'playeroverlayaction';

type PlaybackAction = 'play' | 'pause' | 'mute' | 'unmute';

type PlayerOverlayAction =
  | {
      type: PlaybackAction;
    }
  | {
      type: 'skip';
      seconds: number;
    }
  | {
      type: 'volume';
      percent: number;
    }
  | {
      /** Held 2x playback; stays on screen until sent with `active: false`. */
      type: 'speedup';
      active: boolean;
      speed: number;
    };

type PopupAction = PlayerOverlayAction & {
  id: number;
};

export const dispatchPlayerOverlayAction = (
  overlay: HTMLElement | null | undefined,
  action: PlayerOverlayAction,
) => {
  overlay?.dispatchEvent(
    new CustomEvent<PlayerOverlayAction>(PLAYER_OVERLAY_ACTION_EVENT, {
      detail: action,
    }),
  );
};

const HIDE_DELAY = 750;

/** Where the popup sits; actions in the same slot replace each other in place. */
const getSlot = (action: PopupAction) => {
  switch (action.type) {
    case 'skip':
      return action.seconds > 0 ? 'forward' : 'rewind';
    case 'volume':
    case 'speedup':
      return 'top';
    default:
      return 'center';
  }
};

const getActionLabel = (action: PopupAction) => {
  switch (action.type) {
    case 'skip':
      return `${action.seconds > 0 ? '+' : '−'}${Math.abs(action.seconds)} сек`;
    case 'volume':
      return `${action.percent}%`;
    case 'speedup':
      return `${action.speed}x`;
    default:
      return null;
  }
};

const ActionIcon = ({ action }: { action: PopupAction }) => {
  switch (action.type) {
    case 'play':
      return <MaterialSymbolsPlayArrowOutlineRounded />;
    case 'pause':
      return <MaterialSymbolsPauseOutlineRounded />;
    case 'mute':
      return <MaterialSymbolsVolumeOffOutlineRounded />;
    case 'unmute':
      return <MaterialSymbolsVolumeUpOutlineRounded />;
    case 'volume':
      if (action.percent === 0)
        return <MaterialSymbolsVolumeOffOutlineRounded />;
      return action.percent < 50 ? (
        <MaterialSymbolsVolumeDownOutlineRounded />
      ) : (
        <MaterialSymbolsVolumeUpOutlineRounded />
      );
    case 'speedup':
      return <MaterialSymbolsFastForwardOutlineRounded />;
    case 'skip':
      return action.seconds > 0 ? (
        <MaterialSymbolsFastForwardOutlineRounded />
      ) : (
        <MaterialSymbolsFastRewindOutlineRounded />
      );
  }
};

/** Status chip that drops in at the top: volume level, held speedup. */
const TopPopup = ({ action }: { action: PopupAction }) => (
  <div className="pointer-events-none absolute inset-x-0 top-2 z-50 flex justify-center">
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{
        opacity: 0,
        y: -8,
        scale: 0.9,
        transition: { duration: 0.15, ease: 'easeOut' },
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="bg-background/60 border-shadow flex h-8 items-center gap-2 rounded-md border px-2 text-sm font-medium tabular-nums backdrop-blur-xl [&_svg]:size-5"
    >
      {action.type === 'speedup' ? (
        <>
          {getActionLabel(action)}
          <ActionIcon action={action} />
        </>
      ) : (
        <>
          <ActionIcon action={action} />
          {action.type === 'volume' && (
            <div className="bg-secondary h-1 w-20 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full transition-[width] duration-150"
                style={{ width: `${action.percent}%` }}
              />
            </div>
          )}
          <span className="w-9 text-right">{getActionLabel(action)}</span>
        </>
      )}
    </motion.div>
  </div>
);

/** Round flash over the video: playback toggles in the middle, skips on their side. */
const FlashPopup = ({ action }: { action: PopupAction }) => {
  const slot = getSlot(action);
  const label = getActionLabel(action);

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-y-0 z-50 flex items-center justify-center',
        slot === 'center' && 'inset-x-0',
        slot === 'rewind' && 'left-0 w-1/3',
        slot === 'forward' && 'right-0 w-1/3',
      )}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className={cn(
          'flex flex-col items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm [&_svg]:size-8',
          slot === 'center' ? 'size-16' : 'size-20 gap-0.5',
        )}
      >
        {/* Re-keyed so repeated skips nudge the icon. */}
        <motion.div
          key={action.id}
          initial={{ scale: slot === 'center' ? 1 : 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.15 }}
        >
          <ActionIcon action={action} />
        </motion.div>
        {label && (
          <div className="text-xs font-semibold tabular-nums">{label}</div>
        )}
      </motion.div>
    </div>
  );
};

const ActionPopup = () => {
  const { overlay } = usePlayer();
  // A short-lived action, and a held one (speedup) the top slot falls back to.
  const [flash, setFlash] = useState<PopupAction | null>(null);
  const [held, setHeld] = useState<PopupAction | null>(null);
  const actionIdRef = useRef(0);
  const hideTimerRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    const ref = overlay;
    if (!ref) return;

    const handleAction = (event: Event) => {
      const detail = (event as CustomEvent<PlayerOverlayAction>).detail;
      if (!detail) return;

      actionIdRef.current += 1;
      const action = { ...detail, id: actionIdRef.current };

      if (action.type === 'speedup') {
        setHeld(action.active ? action : null);
        return;
      }

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      setFlash(action);
      hideTimerRef.current = setTimeout(() => {
        setFlash(null);
      }, HIDE_DELAY);
    };

    ref.addEventListener(PLAYER_OVERLAY_ACTION_EVENT, handleAction);

    return () => {
      ref.removeEventListener(PLAYER_OVERLAY_ACTION_EVENT, handleAction);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [overlay]);

  const flashOnTop = flash && getSlot(flash) === 'top';
  const top = flashOnTop ? flash : held;
  const main = flashOnTop ? null : flash;

  return (
    <>
      <AnimatePresence>
        {top && <TopPopup key={top.type} action={top} />}
      </AnimatePresence>
      <AnimatePresence>
        {main && <FlashPopup key={getSlot(main)} action={main} />}
      </AnimatePresence>
    </>
  );
};

export default ActionPopup;
