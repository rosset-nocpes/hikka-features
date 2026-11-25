/** Timings of the music player (see `use-music.ts`). */

/** Past this, "previous" restarts the track instead. */
export const RESTART_AFTER_S = 3;

/*
 * AnimeThemes' audio is Ogg Opus without a seek index. Right after a seek,
 * Chrome's demuxer lets a moment of other audio through, often the song's
 * last second, and a volume change takes as long to reach the speakers as
 * the seek, so fading out can't reliably cover it. Instead a muted twin of
 * the element seeks and starts playing; once it has played cleanly from the
 * new time it crossfades in, so the leak is never heard and the music never
 * stops. A seek while paused mutes the element until it plays cleanly again.
 */
/** How far past its target a seek has to play before it is heard. */
export const SETTLE_S = 0.12;

/** How long the settled twin takes to crossfade in. */
export const CROSSFADE_MS = 120;

/** Fades in a paused seek once it plays. */
export const FADE_IN_MS = 150;

/** How often a fade changes the volume. */
export const STEP_MS = 10;

/** A twin that hasn't settled by then (a stalled load) gives way. */
export const TWIN_DEADLINE_MS = 4_000;

/** A seek to within `REPEAT_S` of where the last one went, this soon, is the same seek again. */
export const REPEAT_MS = 1_000;
export const REPEAT_S = 0.05;
