import { create } from 'zustand';

import { useIFramePlayer } from '@/hooks/use-iframe-player';
import { account } from '@/utils/account';
import {
  convexApi,
  type WatchRoom,
  type WatchRoomProposal,
  type WatchRoomQueueEpisode,
} from '@/utils/convex-api';

import { usePlayer } from '../context/player-context';
import { errorMessage, finite, type RoomQueueEdit, selectionOf } from './room';
import { notifyRoomEnded } from './room-notifications';
import { type OpenRoom, RoomSession } from './room-session';

interface WatchTogetherState {
  status: 'idle' | 'connecting' | 'joined';
  room?: WatchRoom;
  error?: string;
}

interface WatchTogetherActions {
  /** Opens a room on the current episode, signing in first if needed. */
  create: () => Promise<void>;
  /** Joins the room, leaving the one the user is in. */
  join: (code: string) => Promise<void>;
  leave: () => void;
  /** Owner only: lets their friends find the room and join. */
  share: (friendsCanJoin: boolean) => Promise<void>;
  /** Owner only: whether skipping and switching take a vote. */
  setVoting: (voting: boolean) => Promise<void>;
  invite: (userId: string) => Promise<void>;
  /** Edits the queue every member shares. */
  editQueue: (edit: RoomQueueEdit) => void;
  /**
   * Moves the room on: to the queued `item`, else the queue's next episode,
   * else the anime's next one. Unless the episode `ended`, a room that votes
   * votes on it first.
   */
  advance: (
    item?: WatchRoomQueueEpisode,
    options?: { ended?: boolean },
  ) => void;
  /**
   * Does it for everyone, once most members vote for it if the room votes.
   * A `quiet` one, which the user didn't ask for, fails without a word.
   */
  propose: (proposal: WatchRoomProposal, options?: { quiet?: boolean }) => void;
  /** For or against the room's open vote. */
  vote: (yes: boolean) => void;
}

let session: RoomSession | undefined;

export const useWatchTogether = create<
  WatchTogetherState & WatchTogetherActions
>((set) => {
  const end = (current: RoomSession, error?: unknown) => {
    if (session !== current) return;
    session = undefined;
    current.stop();
    const message = error === undefined ? undefined : errorMessage(error);
    // Failing to join shows where it was asked; a room that ends by itself
    // may do so with no menu open.
    if (message && useWatchTogether.getState().status === 'joined') {
      notifyRoomEnded(message);
    }
    set({ status: 'idle', room: undefined, error: message });
  };

  const start = async (open: OpenRoom) => {
    if (session) return;
    const current = new RoomSession(useWatchTogether, (error) =>
      end(current, error),
    );
    session = current;
    set({ status: 'connecting', room: undefined, error: undefined });

    try {
      if (!account.signedIn) await account.login();
      await current.connect(open);
      if (session === current) set({ status: 'joined' });
    } catch (error) {
      if (session === current) console.error(error);
      end(current, error);
    }
  };

  return {
    status: 'idle',

    create: () =>
      start(async (client, tab) => {
        const selection = selectionOf(usePlayer.getState());
        if (!selection) throw new Error('NO_EPISODE');

        const { isPlaying, currentTime, currentSpeed } =
          useIFramePlayer.getState();
        const { code } = await client.mutation(convexApi.watchRooms.create, {
          ...selection,
          playing: isPlaying,
          position: finite(currentTime),
          rate: finite(currentSpeed) || 1,
          tab,
          votes: true,
        });
        return code;
      }),

    join: async (code) => {
      const target = code.trim().toUpperCase();
      if (session?.code === target) return;
      if (session) end(session);
      await start(async () => target);
    },

    leave: () => {
      if (session) end(session);
    },

    share: async (friendsCanJoin) => {
      await session?.share(friendsCanJoin);
    },

    setVoting: async (voting) => {
      await session?.setVoting(voting);
    },

    invite: async (userId) => {
      await session?.invite(userId);
    },

    editQueue: (edit) => session?.editQueue(edit),

    advance: (item, options) => session?.advance(item, options),

    propose: (proposal, options) => session?.propose(proposal, options),

    vote: (yes) => session?.vote(yes),
  };
});
