import { motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import MaterialSymbolsCloseRounded from '~icons/material-symbols/close-rounded';
import MaterialSymbolsGroupOutlineRounded from '~icons/material-symbols/group-outline-rounded';
import MaterialSymbolsLoginRounded from '~icons/material-symbols/login-rounded';

import { Spinner } from '@/components/ui/spinner';
import { useSettings } from '@/hooks/use-settings';

import { usePlayer } from '../context/player-context';
import { MenuError, MenuItem, MenuLabel, MenuSeparator } from './menu';
import { useWatchTogether } from './use-watch-together';

/**
 * Asks before joining a room from an invite link. The click also lets the
 * player start with sound, which browsers block until the page is used.
 */
const WatchTogetherInvite = () => {
  const { roomInvite, roomInviteAccepted, dismissRoomInvite } = usePlayer();
  const { status, error, join } = useWatchTogether();
  const { convexSession } = useSettings();
  const autoJoinedRef = useRef(false);

  const handleJoin = async (code: string) => {
    await join(code);
    if (useWatchTogether.getState().status === 'joined') dismissRoomInvite();
  };

  // Accepted elsewhere already, e.g. from a toast; it only asks again on error.
  useEffect(() => {
    if (!roomInvite || !roomInviteAccepted || !convexSession) return;
    if (autoJoinedRef.current) return;
    autoJoinedRef.current = true;
    void handleJoin(roomInvite);
    // oxlint-disable-next-line eslint-plugin-react-hooks/exhaustive-deps
  }, [roomInvite, roomInviteAccepted, convexSession]);

  if (!roomInvite || status === 'joined') return null;

  const connecting = status === 'connecting';

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center p-4">
      {/* The share popover's surface, centred over the video. */}
      <motion.div
        role="dialog"
        aria-label="Запрошення до спільного перегляду"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="bg-popover/60 text-popover-foreground ring-foreground/10 pointer-events-auto flex w-64 flex-col rounded-md p-1 text-sm shadow-md ring-1 backdrop-blur-xl"
      >
        <MenuLabel>Запрошення до спільного перегляду</MenuLabel>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <MaterialSymbolsGroupOutlineRounded className="size-4 shrink-0" />
          Кімната
          <span className="text-muted-foreground ml-auto text-xs tracking-wide tabular-nums">
            {roomInvite}
          </span>
        </div>
        {error && <MenuError>{error}</MenuError>}
        <MenuSeparator />
        <MenuItem disabled={connecting} onClick={() => handleJoin(roomInvite)}>
          {connecting ? <Spinner /> : <MaterialSymbolsLoginRounded />}
          {convexSession ? 'Приєднатися' : 'Увійти й приєднатися'}
        </MenuItem>
        <MenuItem className="text-muted-foreground" onClick={dismissRoomInvite}>
          <MaterialSymbolsCloseRounded />
          Не зараз
        </MenuItem>
      </motion.div>
    </div>
  );
};

export default WatchTogetherInvite;
