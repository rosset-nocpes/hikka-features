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
import { account } from '@/utils/account';
import {
  convexApi,
  type WatchRoom,
  type WatchRoomAction,
  type WatchRoomQueueEpisode,
  type WatchRoomQueueItem,
  type WatchRoomSelection,
} from '@/utils/convex-api';
import { liveConvex } from '@/utils/convex-client';

import { episodesOf, usePlayer } from '../context/player-context';
import { followRoom } from '../player';
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
/**
 * How long a play or pause from outside the overlay must hold before the
 * room follows it; ads and slow players toggle briefly.
 */
const REPORT_SETTLE_MS = 1_000;
/** Seconds before the end where a pause is the player stopping. */
const REPORT_END_MARGIN = 2;
/** Episodes a room's queue holds, as on the backend. */
const MAX_QUEUE = 100;

type PlayerStore = ReturnType<typeof usePlayer.getState>;
type IFramePlayerStore = ReturnType<typeof useIFramePlayer.getState>;
type SettingsStore = ReturnType<typeof useSettings.getState>;

const ERROR_MESSAGES: Record<string, string> = {
  ROOM_NOT_FOUND: 'Кімнату не знайдено',
  ROOM_CLOSED: 'Кімнату закрито',
  ROOM_FULL: 'Кімната заповнена',
  OTHER_ANIME: 'Кімнату створено для іншого аніме',
  OTHER_TAB: 'Кімната відкрита в іншій вкладці',
  UNAUTHENTICATED: 'Потрібен вхід через hikka.io',
  USER_NOT_FOUND: 'Потрібен вхід через hikka.io',
  EXTENSION_UPDATE_REQUIRED: 'Оновіть розширення, щоб дивитися разом',
  MEMBERS_OUTDATED:
    'Хтось у кімнаті має стару версію розширення, тож інше аніме не ввімкнеться',
  cancelled: 'Вхід скасовано',
  login_expired: 'Час на вхід минув',
  hikka_exchange_failed: 'hikka.io не підтвердила вхід',
};

const errorMessage = (error: unknown) => {
  const code =
    error instanceof ConvexError
      ? (error.data as { code?: string } | undefined)?.code
      : error instanceof Error
        ? error.message
        : undefined;
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  return 'Не вдалося підключитися до кімнати';
};

/** What the player shows: an anime's episode from a source. */
const selectionOf = ({
  slug,
  provider,
  team,
  currentEpisode,
}: PlayerStore): WatchRoomQueueItem | undefined =>
  slug && provider && currentEpisode
    ? {
        animeSlug: slug,
        provider,
        team: team?.title ?? '',
        episode: currentEpisode.episode,
      }
    : undefined;

/** Only the selection, as a room carries more fields than the API takes. */
const pickSelection = ({ provider, team, episode }: WatchRoomSelection) => ({
  provider,
  team,
  episode,
});

const pickPlace = (place: WatchRoomQueueItem) => ({
  animeSlug: place.animeSlug,
  ...pickSelection(place),
});

const sameSelection = (left: WatchRoomQueueItem, right: WatchRoomQueueItem) =>
  left.animeSlug === right.animeSlug &&
  left.provider === right.provider &&
  left.team === right.team &&
  left.episode === right.episode;

const selectionKey = ({
  animeSlug,
  provider,
  team,
  episode,
}: WatchRoomQueueItem) => JSON.stringify([animeSlug, provider, team, episode]);

const queueKey = ({ animeSlug, episode }: WatchRoomQueueEpisode) =>
  `${animeSlug}:${episode}`;

export type RoomQueueEdit = Extract<
  WatchRoomAction,
  { type: 'enqueue' | 'dequeue' | 'requeue' }
>;

/** The queue after an edit, as the backend makes it. */
const applyQueueEdit = (queue: WatchRoomQueueItem[], edit: RoomQueueEdit) => {
  const without = (episodes: WatchRoomQueueEpisode[]) => {
    const keys = new Set(episodes.map(queueKey));
    return queue.filter((item) => !keys.has(queueKey(item)));
  };
  switch (edit.type) {
    case 'enqueue': {
      const added = new Map(
        edit.items.map((item) => [queueKey(item), item] as const),
      );
      queue.forEach((item) => added.delete(queueKey(item)));
      return [...queue, ...added.values()].slice(0, MAX_QUEUE);
    }
    case 'dequeue':
      return without(edit.items);
    case 'requeue': {
      const item = queue.find(
        (queued) => queueKey(queued) === queueKey(edit.item),
      );
      if (!item) return queue;
      const rest = without([edit.item]);
      rest.splice(Math.max(edit.index, 0), 0, item);
      return rest;
    }
  }
};

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

const isAtEnd = (position: number, margin = END_MARGIN) => {
  const { duration } = useIFramePlayer.getState();
  return duration > 0 && position >= duration - margin;
};

const nearest = (options: number[], value: number) =>
  options.reduce((best, option) =>
    Math.abs(option - value) < Math.abs(best - value) ? option : best,
  );

/**
 * A joined room. Its state is the source of truth: the user's changes are
 * sent to it, and the local player is steered to follow it.
 */
class RoomSession {
  code = '';
  /** Tells this tab from the user's others; the last one to join counts. */
  private readonly tab = crypto.randomUUID();
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
  /** The room's episode of another anime, while the player loads it. */
  private following?: WatchRoomQueueItem;
  /** The last action failed, and the room's error says why. */
  private actionFailed = false;
  private beating = false;
  /** Until then, the player toggling answers a command, not the user. */
  private quietUntil = 0;
  /** A new episode's first play is the room's command or autoplay. */
  private playedSinceReady = false;
  private reportTimer?: ReturnType<typeof setTimeout>;

  constructor(private readonly onEnd: (error: unknown) => void) {}

  async connect(open: (client: ConvexClient, tab: string) => Promise<string>) {
    const { client, release } = await liveConvex.acquire();
    if (this.closed) {
      release();
      this.assertOpen();
    }
    this.client = client;
    this.release = release;
    this.code = await open(client, this.tab);
    // The server joins only once it sees the room is for this anime.
    await this.beat({ animeSlug: usePlayer.getState().slug ?? '' });
    for (let sample = 1; sample < 3; sample += 1) await this.beat();

    const room = await this.subscribe(client);
    this.assertOpen();
    if (!room) throw new Error('ROOM_NOT_FOUND');
    if (room.joinedElsewhere) throw new Error('OTHER_TAB');
    // A room on another anime than the player's is followed there.

    useWatchTogether.setState({ room });
    const { isPlaying, currentTime } = useIFramePlayer.getState();
    this.playedSinceReady = isPlaying || currentTime > 0;
    onPlaybackIntent(this.handleIntent);
    const heartbeat = setInterval(this.keepAlive, HEARTBEAT_MS);
    const reconcile = setInterval(this.reconcile, RECONCILE_MS);
    const leave = () => useWatchTogether.getState().leave();
    window.addEventListener('pagehide', leave);
    this.cleanups.push(
      () => onPlaybackIntent(undefined),
      usePlayer.subscribe(this.handlePlayerChange),
      useIFramePlayer.subscribe(this.handlePlayerReport),
      useSettings.subscribe(this.handleAccountChange),
      () => clearInterval(heartbeat),
      () => clearInterval(reconcile),
      () => clearTimeout(this.reportTimer),
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
      ? client.mutation(convexApi.watchRooms.leave, {
          code: this.code,
          tab: this.tab,
        })
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
          { code: this.code, tab: this.tab },
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

  private async beat(join?: { animeSlug: string }) {
    this.assertOpen();
    this.beating = true;
    try {
      const sentAt = Date.now();
      const result = await this.client!.mutation(
        convexApi.watchRooms.heartbeat,
        {
          code: this.code,
          tab: this.tab,
          followsAnime: true,
          ...(join && { join }),
        },
      );
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
    } finally {
      this.beating = false;
    }
  }

  private keepAlive = () => {
    // Offline, beats would queue up behind the one still pending.
    if (this.beating) return;
    this.beat().catch((error) => {
      if (error instanceof Error && error.message === 'ROOM_NOT_FOUND') {
        this.onEnd(new Error('ROOM_CLOSED'));
      } else if (error instanceof ConvexError) {
        // E.g. the room filled up while this tab was offline and dropped.
        this.onEnd(error);
      }
    });
  };

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
    if (room.joinedElsewhere) return this.onEnd(new Error('OTHER_TAB'));

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
        dispatchPlayerOverlayAction(usePlayer.getState().overlay, {
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
    // The player is about to report this change too.
    this.quietUntil = now + COMMAND_RETRY_MS;
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

  /**
   * Shares a play or pause the user made outside the overlay, e.g. in the
   * picture-in-picture window or with media keys. Players also toggle by
   * themselves, for ads, autoplay or the end of an episode, so the change
   * has to last and mustn't answer a command.
   */
  private handlePlayerReport = (
    state: IFramePlayerStore,
    previous: IFramePlayerStore,
  ) => {
    const now = Date.now();
    if (
      state.isReady !== previous.isReady ||
      state.adInProgress !== previous.adInProgress
    ) {
      this.quietUntil = now + COMMAND_RETRY_MS;
      if (!state.isReady) this.playedSinceReady = false;
    }
    if (state.isPlaying === previous.isPlaying) return;

    const firstPlay = state.isPlaying && !this.playedSinceReady;
    if (state.isPlaying) this.playedSinceReady = true;
    if (firstPlay || now < this.quietUntil) return;
    clearTimeout(this.reportTimer);
    this.reportTimer = setTimeout(this.shareReport, REPORT_SETTLE_MS);
  };

  private shareReport = () => {
    this.reportTimer = undefined;
    const { room } = useWatchTogether.getState();
    const iframe = useIFramePlayer.getState();
    const player = usePlayer.getState();
    const selection = selectionOf(player);
    if (
      this.closed ||
      !room ||
      !selection ||
      !sameSelection(selection, room) ||
      !iframe.isReady ||
      iframe.adInProgress ||
      iframe.isPlaying === room.playing ||
      isAtEnd(iframe.currentTime, REPORT_END_MARGIN) ||
      // Phones pause hidden pages; the picture-in-picture window stays up.
      (document.visibilityState === 'hidden' && !player.videoPiPActive)
    ) {
      return;
    }
    this.handleIntent({ type: iframe.isPlaying ? 'play' : 'pause' });
  };

  /** Signing out, or in as someone else, leaves the room. */
  private handleAccountChange = (
    state: SettingsStore,
    previous: SettingsStore,
  ) => {
    const before = previous.userData?.hikkaId;
    const after = state.userData?.hikkaId;
    if (
      (previous.convexSession && !state.convexSession) ||
      (before && after && before !== after)
    ) {
      this.onEnd(undefined);
    }
  };

  /** Shares a source, team or episode the user picked. */
  private handlePlayerChange = (state: PlayerStore, previous: PlayerStore) => {
    const { room } = useWatchTogether.getState();
    if (!room) return;
    if (state.slug !== previous.slug) {
      // Opening another anime than the room's leaves it.
      if (
        state.slug !== room.animeSlug &&
        state.slug !== this.following?.animeSlug
      ) {
        this.onEnd(undefined);
      }
      return;
    }
    // Still loading the room's anime.
    if (state.slug !== room.animeSlug) return;

    const before = selectionOf(previous);
    const to = selectionOf(state);
    if (
      !before ||
      !to ||
      sameSelection(before, to) ||
      sameSelection(to, room)
    ) {
      return;
    }
    const { speedOptions } = useIFramePlayer.getState();
    this.send({
      type: 'select',
      // A player that couldn't follow the room moves it from where it is.
      from: pickSelection(this.unavailable ? room : before),
      to: pickSelection(to),
      ...(speedOptions.length > 0 &&
        !speedOptions.includes(room.rate) && {
          rate: nearest(speedOptions, room.rate),
        }),
    });
  };

  /** Edits the room's queue, showing the edit before the room confirms it. */
  editQueue(edit: RoomQueueEdit) {
    if (this.closed || !this.client) return;
    const args = { code: this.code, tab: this.tab };
    this.client
      .mutation(
        convexApi.watchRooms.control,
        { ...args, action: edit },
        {
          optimisticUpdate: (store) => {
            const room = store.getQuery(convexApi.watchRooms.get, args);
            if (!room) return;
            store.setQuery(convexApi.watchRooms.get, args, {
              ...room,
              queue: applyQueueEdit(room.queue, edit),
            });
          },
        },
      )
      .catch(console.error);
  }

  /**
   * Moves everyone on from the room's episode: to `item`, else the queue's
   * first episode, else the anime's next one. Members who finish together
   * move it once.
   */
  advance(item?: WatchRoomQueueEpisode) {
    const { room } = useWatchTogether.getState();
    if (!room) return;

    const player = usePlayer.getState();
    const selection = selectionOf(player);
    const next =
      !item &&
      selection &&
      sameSelection(selection, room) &&
      player.watchData &&
      episodesOf(player.watchData, room.provider, room.team)?.find(
        (episode) => episode.episode === room.episode + 1,
      );
    this.send({
      type: 'advance',
      from: pickPlace(room),
      ...(item && {
        item: { animeSlug: item.animeSlug, episode: item.episode },
      }),
      ...(next && { next: { ...pickSelection(room), episode: next.episode } }),
    });
  }

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
          tab: this.tab,
        });
        if (this.actionFailed) {
          this.actionFailed = false;
          useWatchTogether.setState({ error: undefined });
        }
      } catch (error) {
        console.error(error);
        // E.g. an older extension in the room keeps it on its anime.
        if (error instanceof ConvexError && !this.closed) {
          this.actionFailed = true;
          useWatchTogether.setState({ error: errorMessage(error) });
        }
      }
    }
    this.sending = false;
    // Convex resolves a mutation once its result reached the subscription.
    this.reconcile();
  }

  private markUnavailable(key: string) {
    this.unavailable = key;
    useWatchTogether.setState({ error: 'Серія з кімнати вам недоступна' });
  }

  /** Loads the room's episode of another anime into the player. */
  private follow(room: WatchRoom) {
    const key = selectionKey(room);
    if (this.following && selectionKey(this.following) === key) return;

    const target = pickPlace(room);
    this.following = target;
    void followRoom({
      slug: target.animeSlug,
      episode: target.episode,
      provider: target.provider,
      team: target.team,
    }).then((shown) => {
      // The room moved on meanwhile.
      if (this.following !== target || this.closed) return;
      this.following = undefined;
      // Unless the user opened the anime meanwhile, which drops this load.
      if (!shown && usePlayer.getState().slug !== target.animeSlug) {
        this.markUnavailable(key);
      }
      this.reconcile();
    });
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
      if (room.animeSlug !== player.slug) return this.follow(room);
      if (!player.selectSource(room.provider, room.team, room.episode)) {
        this.markUnavailable(key);
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
      this.quietUntil = now + COMMAND_RETRY_MS;
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
    if (
      (play || pause) &&
      // The user may have just toggled it outside the overlay.
      !this.reportTimer &&
      now - this.lastToggleAt >= COMMAND_RETRY_MS
    ) {
      this.lastToggleAt = now;
      this.quietUntil = now + COMMAND_RETRY_MS;
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
  /** Edits the queue every member shares. */
  editQueue: (edit: RoomQueueEdit) => void;
  /**
   * Moves the room on: to the queued `item`, else the queue's next episode,
   * else the anime's next one.
   */
  advance: (item?: WatchRoomQueueEpisode) => void;
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

  const start = async (
    open: (client: ConvexClient, tab: string) => Promise<string>,
  ) => {
    if (session) return;
    const current = new RoomSession((error) => end(current, error));
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

    editQueue: (edit) => session?.editQueue(edit),

    advance: (item) => session?.advance(item),
  };
});
