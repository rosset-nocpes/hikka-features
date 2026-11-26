import type { ReactNode } from 'react';

import MaterialSymbolsHowToVoteOutlineRounded from '~icons/material-symbols/how-to-vote-outline-rounded';

import type {
  WatchRoom,
  WatchRoomProposal,
  WatchRoomVote,
} from '@/utils/convex-api';

import { useHikkaContent } from '@/hooks/use-hikka';
import { notify, type NotificationAction } from '@/utils/notify';

import { usePlayer } from '../context/player-context';
import { ROOM_VOTE_OUTCOME_MS } from '../player.constants';
import { memberName } from './menu';
import { MemberMedia } from './room-notifications';

const VOTE_ID = 'watch-together-vote';

const SEGMENTS: Record<
  Extract<WatchRoomProposal, { type: 'skip' }>['segment'],
  string
> = {
  opening: 'опенінг',
  ending: 'ендінг',
  recap: 'рекап',
};

const OUTCOMES: Record<NonNullable<WatchRoomVote['result']>, string> = {
  passed: 'Більшість за',
  rejected: 'Більшість проти',
  failed: 'Більшість за, але зробити це не вдалося',
  expired: 'Час на голосування минув',
  cancelled: 'Голосування скасовано',
};

const eyebrow = (
  <>
    <MaterialSymbolsHowToVoteOutlineRounded />
    Голосування
  </>
);

/** The vote the user closed without voting; it doesn't come back. */
let dismissed: string | undefined;

const AnimeTitle = ({ slug }: { slug: string }) => {
  const { data } = useHikkaContent('anime', slug);
  return <>«{hikkaTitle(data) ?? slug}»</>;
};

const teamTitle = (key: string) =>
  usePlayer.getState().teams?.find((team) => team.key === key)?.title;

/** What the proposal does, to follow "пропонує", or as a sentence. */
function describe(
  proposal: WatchRoomProposal,
  room: WatchRoom,
  sentence = false,
): ReactNode {
  const verb = (text: string) =>
    sentence ? text[0]!.toUpperCase() + text.slice(1) : text;
  switch (proposal.type) {
    case 'skip':
      return `${verb('пропустити')} ${SEGMENTS[proposal.segment]}`;
    case 'advance': {
      const target =
        proposal.item ??
        room.queue[0] ??
        (proposal.next && {
          animeSlug: room.animeSlug,
          episode: proposal.next.episode,
        });
      if (!target) return `${verb('увімкнути')} наступний епізод`;
      if (target.animeSlug === room.animeSlug) {
        return `${verb('увімкнути')} епізод ${target.episode}`;
      }
      return (
        <>
          {verb('увімкнути')} <AnimeTitle slug={target.animeSlug} />, епізод{' '}
          {target.episode}
        </>
      );
    }
    case 'select': {
      const { from, to } = proposal;
      const team = to.team !== from.team ? teamTitle(to.team) : undefined;
      if (to.episode !== from.episode) {
        return `${verb('увімкнути')} епізод ${to.episode}${team ? ` від ${team}` : ''}`;
      }
      if (to.team !== from.team) {
        return `${verb('перейти')} на ${team ?? 'іншу команду'}`;
      }
      return verb('змінити плеєр');
    }
  }
}

/** Casts the user's vote on the vote `id`, while it is open. */
type Cast = (id: string, yes: boolean) => void;

/** The open vote: who proposed what, how it stands, and the user's say. */
function showOpen(room: WatchRoom, vote: WatchRoomVote, cast: Cast) {
  const self = room.members.find((member) => member.self);
  const proposer = room.members.find((member) => member.id === vote.by);
  const own =
    self &&
    (vote.yes.includes(self.id)
      ? true
      : vote.no.includes(self.id)
        ? false
        : undefined);
  const mine = vote.by === self?.id;

  const forIt: NotificationAction = {
    label: 'За',
    primary: true,
    keepOpen: true,
    onClick: () => cast(vote.id, true),
  };
  const against: NotificationAction = {
    label: mine ? 'Скасувати' : 'Проти',
    keepOpen: true,
    onClick: () => cast(vote.id, false),
  };
  const actions =
    mine || own === true
      ? [against]
      : own === false
        ? [forIt]
        : [forIt, against];

  const what = describe(vote.proposal, room);
  notify({
    id: VOTE_ID,
    eyebrow,
    title: mine ? (
      <>Ви пропонуєте {what}</>
    ) : (
      <>
        {proposer ? memberName(proposer) : 'Хтось'} пропонує {what}
      </>
    ),
    description: `За: ${vote.yes.length} з ${vote.needed}${
      mine ? '' : own === true ? ' · ви за' : own === false ? ' · ви проти' : ''
    }`,
    media: proposer && <MemberMedia member={proposer} />,
    actions,
    duration: Infinity,
    urgent: own === undefined,
    onDismiss: (reason) => {
      if (reason === 'user') dismissed = vote.id;
    },
  });
}

/**
 * Shows the room's open vote for the user to vote on, kept up to date, and
 * how it ended once it does, if they saw it open.
 */
export function notifyVote(
  previous: WatchRoom | undefined,
  room: WatchRoom,
  cast: Cast,
) {
  const vote = room.vote;
  const before = previous?.vote;
  const wasOpen = before && !before.result;

  if (vote && !vote.result) {
    if (vote.id === dismissed) return;
    // Members coming and going change who counts.
    if (
      before?.id === vote.id &&
      JSON.stringify(before) === JSON.stringify(vote) &&
      previous?.members.length === room.members.length
    ) {
      return;
    }
    return showOpen(room, vote, cast);
  }

  // One the user closed ends as quietly.
  if (!wasOpen || before.id === dismissed) return;
  // Gone without an outcome: the room got past it.
  if (!vote || vote.id !== before.id || !vote.result) {
    return notify.dismiss(VOTE_ID);
  }
  notify({
    id: VOTE_ID,
    tone:
      vote.result === 'passed'
        ? 'success'
        : vote.result === 'rejected' || vote.result === 'failed'
          ? 'warning'
          : 'default',
    eyebrow,
    title: describe(vote.proposal, previous!, true),
    description: OUTCOMES[vote.result],
    duration: ROOM_VOTE_OUTCOME_MS,
  });
}

/** Proposing or voting didn't go through, e.g. another vote is open. */
export function notifyVoteFailed(type: 'propose' | 'vote', message: string) {
  notify({
    id: `${VOTE_ID}-failed`,
    tone: 'warning',
    eyebrow,
    title:
      type === 'propose'
        ? 'Не вдалося запропонувати'
        : 'Не вдалося проголосувати',
    description: message,
  });
}

/** Leaving the room takes its vote along. */
export function dismissVote() {
  notify.dismiss(VOTE_ID);
}
