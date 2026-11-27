import type { ConvexClient } from 'convex/browser';

import { ConvexError } from 'convex/values';

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
  type WatchRoomProposal,
  type WatchRoomQueueEpisode,
  type WatchRoomQueueItem,
} from '@/utils/convex-api';
import { liveConvex } from '@/utils/live-convex';

import {
  followingEpisode,
  onSelectIntent,
  type SelectIntent,
  speedOptionsOf,
  usePlayer,
} from '../context/player-context';
import { followRoom } from '../player';
import { dispatchPlayerOverlayAction } from '../player-overlay/action-popup';
import {
  ROOM_HEARTBEAT_MS,
  ROOM_RECONCILE_MS,
  PLAYING_TOLERANCE,
  PAUSED_TOLERANCE,
  SEEK_COOLDOWN_MS,
  MAX_SEEK_COOLDOWN_MS,
  COMMAND_RETRY_MS,
  END_MARGIN,
  ROOM_LEAVE_TIMEOUT_MS,
  REPORT_SETTLE_MS,
  REPORT_END_MARGIN,
  PLAY_ATTEMPTS,
} from '../player.constants';
import {
  applyQueueEdit,
  errorMessage,
  finite,
  nearest,
  pickPlace,
  pickSelection,
  playbackKey,
  type RoomQueueEdit,
  sameSelection,
  selectionKey,
  selectionOf,
} from './room';
import { notifyMemberChanges } from './room-notifications';
import { dismissVote, notifyVote, notifyVoteFailed } from './room-votes';

type PlayerStore = ReturnType<typeof usePlayer.getState>;
type IFramePlayerStore = ReturnType<typeof useIFramePlayer.getState>;
type SettingsStore = ReturnType<typeof useSettings.getState>;

/** Creates or finds the room, resolving with its code. */
export type OpenRoom = (client: ConvexClient, tab: string) => Promise<string>;

/** The watch together store's part a session keeps up to date. */
interface RoomStore {
  getState: () => { room?: WatchRoom };
  setState: (state: { room?: WatchRoom; error?: string }) => void;
}

/**
 * What this extension can do in a room, sent with each call that may join
 * the user again, e.g. after the room dropped a tab the browser kept asleep.
 */
const MEMBER_FLAGS = { followsAnime: true, votes: true } as const;

const isAtEnd = (position: number, margin = END_MARGIN) => {
  const { duration } = useIFramePlayer.getState();
  return duration > 0 && position >= duration - margin;
};

/** The server's clock, from heartbeats: the shortest round trip has the least slack. */
class ServerClock {
  private samples: { rtt: number; offset: number }[] = [];

  sample(sentAt: number, receivedAt: number, serverNow: number) {
    // The server read its clock about halfway through the round trip.
    this.samples = [
      ...this.samples.slice(-4),
      {
        rtt: receivedAt - sentAt,
        offset: serverNow - (sentAt + receivedAt) / 2,
      },
    ];
  }

  /** Server time minus local time. */
  get offset() {
    return this.samples.reduce(
      (best, sample) => (sample.rtt < best.rtt ? sample : best),
      { rtt: Infinity, offset: 0 },
    ).offset;
  }
}

/**
 * A joined room. Its state is the source of truth: the user's changes are
 * sent to it, and the local player is steered to follow it.
 */
export class RoomSession {
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
  private readonly clock = new ServerClock();
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
  /** Plays sent since the player last played, to tell a blocked one. */
  private playAttempts = 0;
  /** A blocked player was tried again once the page counted as used. */
  private retriedActivated = false;
  /** Proposals the user didn't ask for, which fail without a word. */
  private readonly quiet = new WeakSet<WatchRoomAction>();

  constructor(
    private readonly store: RoomStore,
    private readonly onEnd: (error: unknown) => void,
  ) {}

  async connect(open: OpenRoom) {
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

    this.store.setState({ room });
    // A vote open as the user joins is theirs too.
    notifyVote(undefined, room, this.castVote);
    const { isPlaying, currentTime } = useIFramePlayer.getState();
    this.playedSinceReady = isPlaying || currentTime > 0;
    onPlaybackIntent(this.handleIntent);
    onSelectIntent(this.handleSelectIntent);
    const heartbeat = setInterval(this.keepAlive, ROOM_HEARTBEAT_MS);
    const reconcile = setInterval(this.reconcile, ROOM_RECONCILE_MS);
    const leave = () => this.onEnd(undefined);
    window.addEventListener('pagehide', leave);
    document.addEventListener('visibilitychange', this.handleReturn);
    window.addEventListener('online', this.handleReturn);
    // Activating the page lets a blocked player start (see `reconcile`).
    window.addEventListener('pointerup', this.handleActivation, true);
    window.addEventListener('keydown', this.handleActivation, true);
    this.cleanups.push(
      () => onPlaybackIntent(undefined),
      () => onSelectIntent(undefined),
      dismissVote,
      usePlayer.subscribe(this.handlePlayerChange),
      useIFramePlayer.subscribe(this.handlePlayerReport),
      useSettings.subscribe(this.handleAccountChange),
      () => clearInterval(heartbeat),
      () => clearInterval(reconcile),
      () => clearTimeout(this.reportTimer),
      () => window.removeEventListener('pagehide', leave),
      () => document.removeEventListener('visibilitychange', this.handleReturn),
      () => window.removeEventListener('online', this.handleReturn),
      () =>
        window.removeEventListener('pointerup', this.handleActivation, true),
      () => window.removeEventListener('keydown', this.handleActivation, true),
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
      new Promise((resolve) => setTimeout(resolve, ROOM_LEAVE_TIMEOUT_MS)),
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

  async setVoting(voting: boolean) {
    await this.client?.mutation(convexApi.watchRooms.setVoting, {
      code: this.code,
      voting,
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
          ...MEMBER_FLAGS,
          ...(join && { join }),
        },
      );
      if (!result) throw new Error('ROOM_NOT_FOUND');

      this.clock.sample(sentAt, Date.now(), result.now);
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

  /**
   * Back in the tab or online: beats at once, rather than up to a heartbeat
   * later, as browsers throttle hidden tabs and the room may have dropped
   * this one meanwhile; then catches up with the room.
   */
  private handleReturn = () => {
    if (document.visibilityState === 'hidden') return;
    this.keepAlive();
    this.reconcile();
  };

  /**
   * The user used the page, which lets a player the browser blocked play:
   * it is steered again.
   */
  private handleActivation = (event: Event) => {
    if (!event.isTrusted || !useIFramePlayer.getState().playBlocked) return;
    this.unblock();
    // After the event, once the browser counts it.
    setTimeout(this.reconcile);
  };

  /** Lets a player the browser blocked be steered again, at once. */
  private unblock() {
    useIFramePlayer.setState({ playBlocked: false });
    this.playAttempts = 0;
    this.lastToggleAt = this.lastSeekAt = 0;
    this.seekCooldown = SEEK_COOLDOWN_MS;
  }

  /** Where the room is now, extrapolated from its last change. */
  private positionOf(room: WatchRoom) {
    if (!room.playing) return room.position;
    const elapsed = Math.max(
      0,
      Date.now() + this.clock.offset - room.updatedAt,
    );
    return room.position + (elapsed / 1_000) * room.rate;
  }

  private handleRoom(room: WatchRoom | null) {
    if (!room) return this.onEnd(new Error('ROOM_CLOSED'));
    if (room.joinedElsewhere) return this.onEnd(new Error('OTHER_TAB'));

    const previous = this.store.getState().room;
    this.store.setState({ room });
    if (previous) notifyMemberChanges(previous, room);
    notifyVote(previous, room, this.castVote);

    const self = room.members.find((member) => member.self);
    // A vote passing moves the room for everyone, whoever cast the last vote.
    const passed =
      room.vote?.result === 'passed' &&
      previous?.vote?.id === room.vote.id &&
      !previous.vote.result;
    if (
      previous &&
      (room.updatedBy !== self?.id || passed) &&
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
    const { room } = this.store.getState();
    if (!room) return;

    const position = finite(useIFramePlayer.getState().currentTime);
    const now = Date.now();
    // The player is about to report this change too.
    this.quietUntil = now + COMMAND_RETRY_MS;
    switch (intent.type) {
      case 'play':
        this.lastToggleAt = now;
        if (room.playing && !isAtEnd(this.positionOf(room))) {
          this.unblock();
          // The play was sent already.
          this.lastToggleAt = now;
          return this.reconcile();
        }
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
    const { room } = this.store.getState();
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
    const { room } = this.store.getState();
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
    // A room that votes puts it to a vote, and steers the player back
    // meanwhile; picks of a team or episode are put to it before they show
    // (see `handleSelectIntent`).
    this.propose({
      type: 'select',
      // A player that couldn't follow the room moves it from where it is.
      from: pickSelection(this.unavailable ? room : before),
      to: pickSelection(to),
      ...this.rateFor(to.provider, room),
    });
  };

  /** A speed for the room's rate the provider's players offer, if it differs. */
  private rateFor(provider: string, room: WatchRoom) {
    const options = speedOptionsOf(provider);
    return options.length > 0 && !options.includes(room.rate)
      ? { rate: nearest(options, room.rate) }
      : {};
  }

  /**
   * In a room that votes, a team or episode the user picks is proposed
   * instead of shown: it plays once the room switches to it.
   */
  private handleSelectIntent = (to: SelectIntent) => {
    const { room } = this.store.getState();
    if (
      !room?.voting ||
      usePlayer.getState().slug !== room.animeSlug ||
      sameSelection({ ...to, animeSlug: room.animeSlug }, room)
    ) {
      return false;
    }
    this.propose({
      type: 'select',
      from: pickSelection(room),
      to,
      ...this.rateFor(to.provider, room),
    });
    return true;
  };

  /**
   * Does it for everyone: at once, or once most members vote for it in a
   * room that votes.
   */
  propose(proposal: WatchRoomProposal, { quiet = false } = {}) {
    const action: WatchRoomAction = { type: 'propose', proposal };
    if (quiet) this.quiet.add(action);
    this.send(action);
  }

  /** For or against the room's open vote, or the vote `id` while it is open. */
  vote(yes: boolean, id?: string) {
    const vote = this.store.getState().room?.vote;
    if (!vote || vote.result || (id !== undefined && vote.id !== id)) return;
    this.send({ type: 'vote', id: vote.id, yes });
  }

  private castVote = (id: string, yes: boolean) => this.vote(yes, id);

  /** Edits the room's queue, showing the edit before the room confirms it. */
  editQueue(edit: RoomQueueEdit) {
    if (this.closed || !this.client) return;
    const args = { code: this.code, tab: this.tab };
    this.client
      .mutation(
        convexApi.watchRooms.control,
        { ...args, ...MEMBER_FLAGS, action: edit },
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
   * move it once; moving on before the end may take a vote.
   */
  advance(item?: WatchRoomQueueEpisode, { ended = false } = {}) {
    const { room } = this.store.getState();
    if (!room) return;

    const player = usePlayer.getState();
    const selection = selectionOf(player);
    const next =
      !item &&
      selection &&
      sameSelection(selection, room) &&
      followingEpisode(player);
    const advance = {
      type: 'advance' as const,
      from: pickPlace(room),
      ...(item && {
        item: { animeSlug: item.animeSlug, episode: item.episode },
      }),
      ...(next && {
        next: {
          provider: next.provider,
          team: room.team,
          episode: next.episode,
        },
      }),
    };
    if (ended) this.send(advance);
    else this.propose(advance);
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
          ...MEMBER_FLAGS,
        });
        if (this.actionFailed) {
          this.actionFailed = false;
          this.store.setState({ error: undefined });
        }
      } catch (error) {
        console.error(error);
        if (this.closed) continue;
        // Shown where it was asked, which may be no menu: e.g. another vote
        // is open.
        if (action.type === 'propose' || action.type === 'vote') {
          if (!this.quiet.has(action)) {
            notifyVoteFailed(action.type, errorMessage(error));
          }
          continue;
        }
        // E.g. an older extension in the room keeps it on its anime.
        if (error instanceof ConvexError) {
          this.actionFailed = true;
          this.store.setState({ error: errorMessage(error) });
        }
      }
    }
    this.sending = false;
    // Convex resolves a mutation once its result reached the subscription.
    this.reconcile();
  }

  private markUnavailable(key: string) {
    this.unavailable = key;
    this.store.setState({ error: 'Серія з кімнати вам недоступна' });
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
    const { room } = this.store.getState();
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
      this.store.setState({ error: undefined });
    }

    const iframe = useIFramePlayer.getState();
    if (!iframe.isReady || iframe.adInProgress) return;
    if (iframe.isPlaying || !room.playing) this.playAttempts = 0;
    if (iframe.isPlaying) this.retriedActivated = false;
    if (room.playing && iframe.playBlocked) {
      if (this.retriedActivated || !navigator.userActivation?.hasBeenActive) {
        return;
      }
      this.retriedActivated = true;
      this.unblock();
    }

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
      // Players that can't say the browser blocked them just don't play.
      if (play && this.playAttempts >= PLAY_ATTEMPTS) {
        useIFramePlayer.setState({ playBlocked: true });
        return;
      }
      if (play) this.playAttempts += 1;
      this.lastToggleAt = now;
      this.quietUntil = now + COMMAND_RETRY_MS;
      sendIFramePlayerCommand({ action: play ? 'play' : 'pause' });
    }
  };
}
