import type { ConvexClient } from 'convex/browser';

import { ConvexError } from 'convex/values';
import { create } from 'zustand';

import {
  onPlaybackIntent,
  type PlaybackIntent,
  useIFramePlayer,
} from '@/hooks/use-iframe-player';
import { useSettings } from '@/hooks/use-settings';
import { sendIFramePlayerCommand } from '@/integrations/iframe-player/protocol';
import {
  convexApi,
  type WatchRoom,
  type WatchRoomAction,
  type WatchRoomSelection,
} from '@/utils/convex-api';
import { acquireLiveClient } from '@/utils/convex-client';
import { Login } from '@/utils/hikka-integration';

import { usePlayer } from '../context/player-context';
import { dispatchPlayerOverlayAction } from '../player-overlay/action-popup';

const HEARTBEAT_MS = 30_000;
const RECONCILE_MS = 1_000;
/**
 * Seconds a playing player may drift before it is moved. Players report their
 * time a few times a second.
 */
const PLAYING_TOLERANCE = 1.5;
const PAUSED_TOLERANCE = 0.5;
/**
 * Pause after moving the player, doubled while it keeps falling behind, so a
 * slow connection plays instead of rebuffering after every correction.
 */
const SEEK_COOLDOWN_MS = 3_000;
const MAX_SEEK_COOLDOWN_MS = 24_000;
/** Players take a moment to report a play, pause or speed change. */
const COMMAND_RETRY_MS = 2_000;
/** Seconds before the end where players stop on their own. */
const END_MARGIN = 0.5;
const LEAVE_TIMEOUT_MS = 3_000;

type PlayerStore = ReturnType<typeof usePlayer.getState>;

const ERROR_MESSAGES: Record<string, string> = {
  ROOM_NOT_FOUND: 'Кімнату не знайдено',
  ROOM_CLOSED: 'Кімнату закрито',
  ROOM_FULL: 'Кімната заповнена',
  OTHER_ANIME: 'Кімнату створено для іншого аніме',
  UNAUTHENTICATED: 'Потрібен вхід через hikka.io',
  EXTENSION_UPDATE_REQUIRED: 'Оновіть розширення, щоб дивитися разом',
};

const errorMessage = (error: unknown) => {
  const code =
    error instanceof ConvexError
      ? (error.data as { code?: string } | undefined)?.code
      : error instanceof Error
        ? error.message
        : undefined;
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  if (code && /cancel|closed|approve/i.test(code)) return 'Вхід скасовано';
  return 'Не вдалося підключитися до кімнати';
};

const selectionOf = ({
  provider,
  team,
  currentEpisode,
}: PlayerStore): WatchRoomSelection | undefined =>
  provider && currentEpisode
    ? { provider, team: team?.title ?? '', episode: currentEpisode.episode }
    : undefined;

const sameSelection = (left: WatchRoomSelection, right: WatchRoomSelection) =>
  left.provider === right.provider &&
  left.team === right.team &&
  left.episode === right.episode;

const selectionKey = ({ provider, team, episode }: WatchRoomSelection) =>
  JSON.stringify([provider, team, episode]);

/** Changes when the room's playback does, unlike when members come and go. */
const playbackKey = (room: WatchRoom) =>
  JSON.stringify([
    selectionKey(room),
    room.playing,
    room.position,
    room.rate,
    room.updatedAt,
  ]);

const finite = (value: number) =>
  Number.isFinite(value) && value > 0 ? value : 0;

const isAtEnd = (position: number) => {
  const { duration } = useIFramePlayer.getState();
  return duration > 0 && position >= duration - END_MARGIN;
};

/**
 * A joined room. Its state is the source of truth: the user's changes are
 * sent to it, and the local player is steered to follow it.
 */
class RoomSession {
  code = '';
  private client?: ConvexClient;
  private release?: () => void;
  private closed = false;
  private readonly cleanups: (() => void)[] = [];
  /** Actions behind the one being sent; the player isn't steered meanwhile. */
  private queue: WatchRoomAction[] = [];
  private sending = false;
  /** Recent clock samples; the shortest round trip has the least slack. */
  private clockSamples: { rtt: number; offset: number }[] = [];
  private lastToggleAt = 0;
  private lastRateAt = 0;
  private lastSeekAt = 0;
  private seekCooldown = SEEK_COOLDOWN_MS;
  /** A room source this player lacks, so it isn't retried every tick. */
  private unavailable?: string;

  constructor(private readonly onEnd: (error: unknown) => void) {}

  async connect(open: (client: ConvexClient) => Promise<string>) {
    const { client, release } = await acquireLiveClient();
    if (this.closed) {
      release();
      this.assertOpen();
    }
    this.client = client;
    this.release = release;
    this.code = await open(client);
    for (let sample = 0; sample < 3; sample += 1) await this.beat();

    const room = await this.subscribe(client);
    this.assertOpen();
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.animeSlug !== usePlayer.getState().slug) {
      throw new Error('OTHER_ANIME');
    }

    useWatchTogether.setState({ room });
    onPlaybackIntent(this.handleIntent);
    const heartbeat = setInterval(() => {
      this.beat().catch((error) => {
        if (error instanceof Error && error.message === 'ROOM_NOT_FOUND') {
          this.onEnd(new Error('ROOM_CLOSED'));
        }
      });
    }, HEARTBEAT_MS);
    const reconcile = setInterval(this.reconcile, RECONCILE_MS);
    const leave = () => useWatchTogether.getState().leave();
    window.addEventListener('pagehide', leave);
    this.cleanups.push(
      () => onPlaybackIntent(undefined),
      usePlayer.subscribe(this.handlePlayerChange),
      () => clearInterval(heartbeat),
      () => clearInterval(reconcile),
      () => window.removeEventListener('pagehide', leave),
    );
    this.reconcile();
  }

  stop() {
    if (this.closed) return;
    this.closed = true;
    this.cleanups.splice(0).forEach((cleanup) => cleanup());

    const { client, release } = this;
    if (!client || !release) return;
    const left = this.code
      ? client.mutation(convexApi.watchRooms.leave, { code: this.code })
      : Promise.resolve();
    // An offline client can't leave; the room drops it once it goes quiet.
    void Promise.race([
      left,
      new Promise((resolve) => setTimeout(resolve, LEAVE_TIMEOUT_MS)),
    ])
      .catch(() => undefined)
      .finally(release);
  }

  async share(friendsCanJoin: boolean) {
    await this.client?.mutation(convexApi.watchRooms.share, {
      code: this.code,
      friendsCanJoin,
    });
  }

  async invite(userId: string) {
    await this.client?.mutation(convexApi.watchRooms.invite, {
      code: this.code,
      userId,
    });
  }

  private assertOpen() {
    if (this.closed) throw new Error('LEFT');
  }

  /** Resolves with the first room state, then keeps following it. */
  private subscribe(client: ConvexClient) {
    return new Promise<WatchRoom | null>((resolve, reject) => {
      let first = true;
      this.cleanups.push(
        client.onUpdate(
          convexApi.watchRooms.get,
          { code: this.code },
          (room) => {
            if (!first) return this.handleRoom(room);
            first = false;
            resolve(room);
          },
          (error) => {
            if (!first) return this.onEnd(error);
            first = false;
            reject(error);
          },
        ),
      );
    });
  }

  private async beat() {
    this.assertOpen();
    const sentAt = Date.now();
    const result = await this.client!.mutation(convexApi.watchRooms.heartbeat, {
      code: this.code,
    });
    if (!result) throw new Error('ROOM_NOT_FOUND');

    const receivedAt = Date.now();
    // The server read its clock about halfway through the round trip.
    this.clockSamples = [
      ...this.clockSamples.slice(-4),
      {
        rtt: receivedAt - sentAt,
        offset: result.now - (sentAt + receivedAt) / 2,
      },
    ];
  }

  /** Server time minus local time. */
  private get clockOffset() {
    return this.clockSamples.reduce(
      (best, sample) => (sample.rtt < best.rtt ? sample : best),
      { rtt: Infinity, offset: 0 },
    ).offset;
  }

  /** Where the room is now, extrapolated from its last change. */
  private positionOf(room: WatchRoom) {
    if (!room.playing) return room.position;
    const elapsed = Math.max(0, Date.now() + this.clockOffset - room.updatedAt);
    return room.position + (elapsed / 1_000) * room.rate;
  }

  private handleRoom(room: WatchRoom | null) {
    if (!room) return this.onEnd(new Error('ROOM_CLOSED'));

    const previous = useWatchTogether.getState().room;
    useWatchTogether.setState({ room });

    const self = room.members.find((member) => member.self);
    if (
      previous &&
      room.updatedBy !== self?.id &&
      playbackKey(previous) !== playbackKey(room)
    ) {
      // The cooldowns stop correction loops; someone else's change is
      // followed at once.
      this.lastToggleAt = this.lastRateAt = this.lastSeekAt = 0;
      this.seekCooldown = SEEK_COOLDOWN_MS;
      // Their play or pause flashes like the user's own would.
      if (previous.playing !== room.playing) {
        dispatchPlayerOverlayAction(usePlayer.getState().overlayRef.current, {
          type: room.playing ? 'play' : 'pause',
        });
      }
    }
    this.reconcile();
  }

  private handleIntent = (intent: PlaybackIntent) => {
    const { room } = useWatchTogether.getState();
    if (!room) return;

    const position = finite(useIFramePlayer.getState().currentTime);
    const now = Date.now();
    switch (intent.type) {
      case 'play':
        // Already playing for everyone: a player left behind, e.g. by
        // blocked autoplay, only needs to catch up.
        if (room.playing && !isAtEnd(this.positionOf(room))) return;
        this.lastToggleAt = now;
        // Players start over when played at the end.
        return this.send({
          type: 'play',
          position: isAtEnd(position) ? 0 : position,
        });
      case 'pause':
        this.lastToggleAt = now;
        return this.send({ type: 'pause', position });
      case 'seek':
        this.lastSeekAt = now;
        return this.send({ type: 'seek', position: finite(intent.position) });
      case 'rate':
        this.lastRateAt = now;
        return this.send({ type: 'rate', position, rate: intent.rate });
    }
  };

  /** Shares a source, team or episode the user picked. */
  private handlePlayerChange = (state: PlayerStore, previous: PlayerStore) => {
    const { room } = useWatchTogether.getState();
    if (!room) return;
    if (state.slug !== room.animeSlug) {
      return this.onEnd(new Error('OTHER_ANIME'));
    }

    const from = selectionOf(previous);
    const to = selectionOf(state);
    if (!from || !to || sameSelection(from, to) || sameSelection(to, room)) {
      return;
    }
    this.send({ type: 'select', from, to });
  };

  private send(action: WatchRoomAction) {
    const last = this.queue.at(-1);
    // Scrubbing seeks many times a second; only the latest position matters.
    if (
      last?.type === action.type &&
      (action.type === 'seek' || action.type === 'rate')
    ) {
      this.queue[this.queue.length - 1] = action;
    } else {
      this.queue.push(action);
    }
    void this.flush();
  }

  private async flush() {
    if (this.sending) return;
    this.sending = true;
    for (
      let action = this.queue.shift();
      action && !this.closed;
      action = this.queue.shift()
    ) {
      try {
        await this.client!.mutation(convexApi.watchRooms.control, {
          code: this.code,
          action,
        });
      } catch (error) {
        console.error(error);
      }
    }
    this.sending = false;
    // Convex resolves a mutation once its result reached the subscription.
    this.reconcile();
  }

  /** Steers the local player towards the room. */
  private reconcile = () => {
    const { room } = useWatchTogether.getState();
    if (this.closed || !room || this.sending || this.queue.length) return;

    const player = usePlayer.getState();
    const selection = selectionOf(player);
    if (!selection || !sameSelection(selection, room)) {
      const key = selectionKey(room);
      if (this.unavailable === key) return;
      if (!player.selectSource(room.provider, room.team, room.episode)) {
        this.unavailable = key;
        useWatchTogether.setState({ error: 'Серія з кімнати вам недоступна' });
      }
      // The new episode is steered once its player is ready.
      return;
    }
    if (this.unavailable) {
      this.unavailable = undefined;
      useWatchTogether.setState({ error: undefined });
    }

    const iframe = useIFramePlayer.getState();
    if (!iframe.isReady || iframe.adInProgress) return;

    const now = Date.now();
    const position = finite(iframe.currentTime);
    const target = this.positionOf(room);
    const expected = isAtEnd(target)
      ? Math.max(0, iframe.duration - END_MARGIN)
      : target;
    const drift = Math.abs(position - expected);
    if (drift <= (room.playing ? PLAYING_TOLERANCE : PAUSED_TOLERANCE)) {
      this.seekCooldown = SEEK_COOLDOWN_MS;
    } else if (now - this.lastSeekAt >= this.seekCooldown) {
      this.lastSeekAt = now;
      this.seekCooldown = Math.min(this.seekCooldown * 2, MAX_SEEK_COOLDOWN_MS);
      sendIFramePlayerCommand({ action: 'seek', value: expected });
    }

    const rateIndex = iframe.speedOptions.indexOf(room.rate);
    if (
      iframe.currentSpeed !== room.rate &&
      rateIndex !== -1 &&
      now - this.lastRateAt >= COMMAND_RETRY_MS
    ) {
      this.lastRateAt = now;
      sendIFramePlayerCommand({
        action: 'set-speed',
        value: room.rate,
        index: rateIndex,
      });
    }

    // A playing player runs to its end, where it advances to the next
    // episode; one that has stopped there would start over if played.
    const play = room.playing && !iframe.isPlaying && !isAtEnd(position);
    const pause = !room.playing && iframe.isPlaying;
    if ((play || pause) && now - this.lastToggleAt >= COMMAND_RETRY_MS) {
      this.lastToggleAt = now;
      sendIFramePlayerCommand({ action: play ? 'play' : 'pause' });
    }
  };
}

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
  invite: (userId: string) => Promise<void>;
}

let session: RoomSession | undefined;

export const useWatchTogether = create<
  WatchTogetherState & WatchTogetherActions
>((set) => {
  const end = (current: RoomSession, error?: unknown) => {
    if (session !== current) return;
    session = undefined;
    current.stop();
    set({
      status: 'idle',
      room: undefined,
      error: error === undefined ? undefined : errorMessage(error),
    });
  };

  const start = async (open: (client: ConvexClient) => Promise<string>) => {
    if (session) return;
    const current = new RoomSession((error) => end(current, error));
    session = current;
    set({ status: 'connecting', room: undefined, error: undefined });

    try {
      if (!useSettings.getState().convexSession) await Login();
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
      start(async (client) => {
        const player = usePlayer.getState();
        const selection = selectionOf(player);
        if (!player.slug || !selection) throw new Error('NO_EPISODE');

        const { isPlaying, currentTime, currentSpeed } =
          useIFramePlayer.getState();
        const { code } = await client.mutation(convexApi.watchRooms.create, {
          animeSlug: player.slug,
          ...selection,
          playing: isPlaying,
          position: finite(currentTime),
          rate: finite(currentSpeed) || 1,
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

    invite: async (userId) => {
      await session?.invite(userId);
    },
  };
});
