/** Limits and timings of the team pages. */

// The list of teams

/** Teams a part shows at first and adds by each "show more". */
export const TEAM_LIST_PAGE_SIZE = 6;

/** Posters before the tile that opens the team. */
export const TEAM_LIST_POSTERS = 4;

// A team's release days

/** Fewer posts than this say nothing about a team's habits. */
export const RELEASE_DAYS_MIN_RELEASES = 10;

/** The backend's cap on the release times it sends. */
export const RELEASE_DAYS_MAX_RELEASES = 500;

/** A day this far above an even share is the team's day. */
export const RELEASE_DAYS_PEAK_SHARE = 1.4;

/** How long a jump to a section scrolls for. */
export const CONTENTS_JUMP_MS = 500;

// A team's page

/** Releases still coming out, if the team posted one this long ago. */
export const ONGOING_MS = 90 * 24 * 60 * 60_000;

/** How long a link has to be pointed at before its team page is fetched. */
export const PREFETCH_HOVER_MS = 80;
