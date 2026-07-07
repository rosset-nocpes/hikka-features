import { useEffect, useRef, useState } from 'react';
import MaterialSymbolsFastForwardOutlineRounded from '~icons/material-symbols/fast-forward-outline-rounded';
import MaterialSymbolsFastRewindOutlineRounded from '~icons/material-symbols/fast-rewind-outline-rounded';
import MaterialSymbolsPauseOutlineRounded from '~icons/material-symbols/pause-outline-rounded';
import MaterialSymbolsPlayArrowOutlineRounded from '~icons/material-symbols/play-arrow-outline-rounded';
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

const getActionLabel = (action: PopupAction) => {
  if (action.type !== 'skip') return null;

  const seconds = Math.abs(action.seconds);

  return `${seconds} сек`;
};

const ActionIcon = ({ action }: { action: PopupAction }) => {
  switch (action.type) {
    case 'play':
      return <MaterialSymbolsPlayArrowOutlineRounded className="size-12" />;
    case 'pause':
      return <MaterialSymbolsPauseOutlineRounded className="size-12" />;
    case 'mute':
      return <MaterialSymbolsVolumeOffOutlineRounded className="size-12" />;
    case 'unmute':
      return <MaterialSymbolsVolumeUpOutlineRounded className="size-12" />;
    case 'skip':
      return action.seconds > 0 ? (
        <MaterialSymbolsFastForwardOutlineRounded className="size-12" />
      ) : (
        <MaterialSymbolsFastRewindOutlineRounded className="size-12" />
      );
  }
};

const ActionPopup = () => {
  const { overlayRef } = usePlayer();
  const [action, setAction] = useState<PopupAction | null>(null);
  const actionIdRef = useRef(0);
  const hideTimerRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    const ref = overlayRef.current;
    if (!ref) return;

    const handleAction = (event: Event) => {
      const detail = (event as CustomEvent<PlayerOverlayAction>).detail;
      if (!detail) return;

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      actionIdRef.current += 1;
      setAction({ ...detail, id: actionIdRef.current });
      hideTimerRef.current = setTimeout(() => {
        setAction(null);
      }, 750);
    };

    ref.addEventListener(PLAYER_OVERLAY_ACTION_EVENT, handleAction);

    return () => {
      ref.removeEventListener(PLAYER_OVERLAY_ACTION_EVENT, handleAction);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [overlayRef]);

  if (!action) return null;

  const label = getActionLabel(action);

  return (
    <div
      key={action.id}
      className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center"
    >
      <div className="animate-in fade-in-0 zoom-in-95 flex size-24 flex-col items-center justify-center rounded-full bg-black/65 text-white shadow-lg duration-150">
        <ActionIcon action={action} />
        {label && <div className="mt-1 text-sm font-semibold">{label}</div>}
      </div>
    </div>
  );
};

export default ActionPopup;
