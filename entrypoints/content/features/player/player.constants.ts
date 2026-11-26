/** Timings and limits of the extension's player, its queue and watch together. */

// Skipping openings and endings

/** How often to look again while the episode is read, without a live connection. */
export const SKIP_POLL_MS = 3_000;

/** How often to look anyway with one: it may have dropped without a word. */
export const SKIP_BACKUP_POLL_MS = 15_000;

/** A live connection silent this long after starting isn't there (blocked WebSockets). */
export const SKIP_LIVE_WAIT_MS = 5_000;

/** A request unanswered this long is asked again (another may be stuck). */
export const SKIP_REQUEST_WAIT_MS = 15_000;

/** A read that takes longer than this has failed; stop waiting. */
export const SKIP_WAIT_FOR_MS = 10 * 60_000;

/** Seconds two copies may differ by and still be one cut (as the backend). */
export const DURATION_TOLERANCE = 3;

/** While the controls are hidden, the button still shows this long. */
export const SKIP_SHOWN_ALONE_S = 8;

/** The fade's length, as the controls' (`duration-300`). */
export const SKIP_FADE_MS = 300;

/**
 * How long the button stays hidden for a segment skipped by itself: should
 * the player not have taken the seek, it shows by then.
 */
export const AUTO_SKIP_HIDE_MS = 2_000;

// Players

/** The speeds Ashdi's player offers; the others offer the default list. */
export const ASHDI_SPEED_OPTIONS = [1, 1.25, 1.5, 2];

// Overlay

/** How long a play, pause or seek popup stays up. */
export const ACTION_POPUP_HIDE_MS = 750;

/** Avatars the toolbar button fits; more collapse into a count. */
export const TRIGGER_AVATARS = 3;

/** The top bar on phones keeps its chips small. */
export const COMPACT_TRIGGER_AVATARS = 2;

/** How far each avatar tucks under the next (`-space-x-1.5`). */
export const AVATAR_OVERLAP = 6;

// Progress

/** Share of an episode after which it counts as watched on hikka.io. */
export const WATCHED_SHARE = 0.88;

/**
 * Share of an episode after which the next one's anime loads, so it starts
 * at once even when it is another anime's.
 */
export const PRELOAD_SHARE = 0.8;

// Queue

/** How long the next episode waits, so the user can stop it. */
export const UP_NEXT_COUNTDOWN_MS = 8_000;

/** Long enough to notice and react; hovering or focusing it pauses it. */
export const QUEUE_NOTICE_MS = 8_000;

// Watch together

/** Episodes a room's queue holds, as on the backend. */
export const MAX_ROOM_QUEUE = 100;

/** How long a member's coming or going is shown. */
export const ROOM_MEMBER_NOTICE_MS = 4_000;

/** How long a vote's outcome is shown. */
export const ROOM_VOTE_OUTCOME_MS = 4_000;

/** How often a member tells the room it is still there, and checks it is in step. */
export const ROOM_HEARTBEAT_MS = 30_000;
export const ROOM_RECONCILE_MS = 1_000;

/**
 * Seconds a playing player may drift before it is moved. Players report their
 * time a few times a second.
 */
export const PLAYING_TOLERANCE = 1.5;

/** The same while paused, when nothing makes it drift. */
export const PAUSED_TOLERANCE = 0.5;

/**
 * Pause after moving the player, doubled while it keeps falling behind, so a
 * slow connection plays instead of rebuffering after every correction.
 */
export const SEEK_COOLDOWN_MS = 3_000;

/** The longest that pause grows to. */
export const MAX_SEEK_COOLDOWN_MS = 24_000;

/** Players take a moment to report a play, pause or speed change. */
export const COMMAND_RETRY_MS = 2_000;

/** Seconds before the end where players stop on their own. */
export const END_MARGIN = 0.5;

/** How long leaving a room may take when the tab closes. */
export const ROOM_LEAVE_TIMEOUT_MS = 3_000;

/**
 * How long a play or pause from outside the overlay must hold before the
 * room follows it; ads and slow players toggle briefly.
 */
export const REPORT_SETTLE_MS = 1_000;

/** Seconds before the end where a pause is the player stopping. */
export const REPORT_END_MARGIN = 2;
