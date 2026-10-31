import { useEffect, useId, useState } from 'react';
import MaterialSymbolsGroupOutlineRounded from '~icons/material-symbols/group-outline-rounded';
import MaterialSymbolsLoginRounded from '~icons/material-symbols/login-rounded';
import MaterialSymbolsVisibilityOutlineRounded from '~icons/material-symbols/visibility-outline-rounded';

import type { FriendActivity } from '@/utils/convex-api';

import { HFLogo } from '@/components/feature-card';
import BlockHeader from '@/components/hikka/block-header';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { useHikkaContent } from '@/hooks/use-hikka';
import { useLiveQuery } from '@/hooks/use-live-query';
import { useSettings } from '@/hooks/use-settings';
import { account } from '@/utils/account';
import { convexApi } from '@/utils/convex-api';
import { liveConvex } from '@/utils/convex-client';
import { useHikkaViewer } from '@/utils/hikka-viewer';

import { memberName } from '../player/watch-together/menu';
import { openRoom } from '../player/watch-together/open-room';
import { formatTimestamp } from '../release-notifications/feed-layout';
import { useBlockView } from './home-placement';
import { BLOCK_TITLE } from './site-layout';

/** Who sees what: guests and other accounts nothing, at all. */
type Mode = 'hidden' | 'sign-in' | 'friends';

function useMode(): Mode {
  const signedIn = useSettings((state) => Boolean(state.convexSession));
  const viewer = useHikkaViewer();

  if (!viewer || viewer === 'guest') return 'hidden';
  if (!signedIn) return 'sign-in';
  // Friends belong to the account the extension is signed in as.
  return viewer === 'account' ? 'friends' : 'hidden';
}

const Dot = () => <span aria-hidden>·</span>;

const plural = new Intl.PluralRules('uk');

/** "12 епізодів", as hikka.io words a total; "?" when it isn't known. */
const UNITS = {
  episode: { one: 'епізод', few: 'епізоди', many: 'епізодів' },
  chapter: { one: 'розділ', few: 'розділи', many: 'розділів' },
};
function unitOf(unit: keyof typeof UNITS, total?: number | null) {
  const form = total ? plural.select(total) : 'many';
  return UNITS[unit][form === 'one' || form === 'few' ? form : 'many'];
}

/** Re-renders now and then, so "5 хв тому" keeps up. */
function useNow() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/** "5/12 епізодів", the episode or chapter out of the title's total. */
const Progress = ({
  current,
  total,
  unit,
}: {
  current: number;
  total?: number | null;
  unit: keyof typeof UNITS;
}) => (
  <span className="shrink-0">
    <span className="text-foreground font-bold">{current}</span>/{total || '?'}{' '}
    {unitOf(unit, total)}
  </span>
);

/**
 * One friend and what they have open: who, doing what and since when on top,
 * then the title and how far in, beside its poster.
 * The whole row opens the title; a room they share can be joined from it.
 */
const Row = ({ activity, now }: { activity: FriendActivity; now: number }) => {
  const { friend, contentType, slug } = activity;
  const { data: content, isLoading } = useHikkaContent(contentType, slug);
  const title: string = hikkaTitle(content) || slug;
  const name = memberName(friend);
  const href = `/${contentType}/${slug}`;
  const watching = activity.contentType === 'anime' ? activity : undefined;
  const live = isPlaying(activity);
  const time = formatTimestamp(activity.updatedAt, now);
  const room = watching?.room;

  return (
    <div className="hover:bg-accent relative flex items-center gap-4 px-4 py-2 transition-colors">
      <div className="w-12 shrink-0">
        <AspectRatio
          ratio={0.7}
          className="bg-muted overflow-hidden rounded-md"
        >
          {content?.image && (
            <img
              src={content.image}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          )}
        </AspectRatio>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
          <a
            href={friend.username ? `/u/${friend.username}` : undefined}
            className="text-foreground relative z-10 flex min-w-0 items-center gap-1.5 font-medium hover:underline"
          >
            <Avatar className="size-4">
              {friend.avatar && <AvatarImage src={friend.avatar} alt="" />}
              <AvatarFallback className="text-[9px]">
                {name[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{name}</span>
          </a>
          <span className="shrink-0">
            {!watching ? 'читає' : live ? 'дивиться' : 'на паузі'}
          </span>
          <time
            dateTime={time.iso}
            title={time.full}
            className="ml-auto shrink-0 pl-2 tabular-nums opacity-60"
          >
            {live ? 'зараз' : time.label}
          </time>
        </p>
        <a
          href={href}
          title={title}
          className="line-clamp-1 text-sm leading-snug font-medium after:absolute after:inset-0"
        >
          {isLoading ? <Skeleton className="my-0.5 h-3.5 w-3/4" /> : title}
        </a>
        <p className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs whitespace-nowrap">
          {activity.contentType === 'anime' ? (
            <Progress
              current={activity.episode}
              total={content?.episodes_total}
              unit="episode"
            />
          ) : (
            <>
              {activity.volume ? (
                <>
                  <span className="shrink-0">Том {activity.volume}</span>
                  <Dot />
                </>
              ) : null}
              <Progress
                current={activity.chapter}
                total={content?.chapters}
                unit="chapter"
              />
            </>
          )}
          {room && (
            <>
              <Dot />
              <span
                className="flex shrink-0 items-center gap-0.5"
                title="Дивляться разом"
              >
                <MaterialSymbolsGroupOutlineRounded className="size-3.5" />
                {room.memberCount}
              </span>
            </>
          )}
        </p>
      </div>

      {room?.code && (
        <Button
          size="sm"
          variant="secondary"
          className="relative z-10 shrink-0"
          onClick={() => openRoom(slug, room.code!)}
        >
          Приєднатися
        </Button>
      )}
    </div>
  );
};

const SkeletonRow = () => (
  <div className="flex items-center gap-4 px-4 py-2">
    <Skeleton className="aspect-[0.7] w-12 shrink-0" />
    <div className="flex flex-1 flex-col gap-2">
      <div className="flex items-center gap-1.5">
        <Skeleton className="size-4 rounded-full" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-3.5 w-3/4" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  </div>
);

/** The user's own sharing, in the card's footer as the site's tracker has. */
const SharingFooter = () => {
  const id = useId();
  const sharing = useLiveQuery(convexApi.activity.settings, {})?.data
    ?.shareActivity;
  const [pending, setPending] = useState<boolean>();
  const shown = pending ?? sharing ?? false;

  const toggle = (shareActivity: boolean) => {
    setPending(shareActivity);
    // Resolves once the live query shows it.
    void liveConvex
      .mutation(convexApi.activity.setSharing, { shareActivity })
      .catch(console.error)
      .finally(() => setPending(undefined));
  };

  return (
    <div className="text-muted-foreground -mx-4 -mb-4 flex items-center gap-2 rounded-b-lg border-t px-4 py-3">
      <MaterialSymbolsVisibilityOutlineRounded className="size-4 shrink-0" />
      <Label htmlFor={id} className="flex-1">
        Ділитися моєю активністю
      </Label>
      <Switch
        id={id}
        checked={shown}
        disabled={sharing === undefined || pending !== undefined}
        onCheckedChange={toggle}
      />
    </div>
  );
};

/** Who is watching right now first, then whoever was here last. */
const byRecency = (a: FriendActivity, b: FriendActivity) =>
  Number(isPlaying(b)) - Number(isPlaying(a)) || b.updatedAt - a.updatedAt;

const isPlaying = (activity: FriendActivity) =>
  activity.contentType === 'anime' && activity.playing;

const FriendsList = () => {
  const activities = useLiveQuery(convexApi.activity.friends, {})?.data;
  const now = useNow();

  // Friends are the mutual follows among extension users; read them again
  // now and then (the server limits how often).
  useEffect(() => {
    void account.refreshFriends();
  }, []);

  if (activities?.length === 0) {
    return (
      <EmptyState
        size="sm"
        icon={<MaterialSymbolsGroupOutlineRounded />}
        title="Зараз ніхто не дивиться й не читає"
        description="Тут з’являться друзі з розширенням, з якими ви взаємно підписані, коли вмикатимуть аніме чи відкриватимуть читалку"
      />
    );
  }
  return (
    <div className="-mx-4 flex flex-col gap-1">
      {activities === undefined ? (
        <>
          <SkeletonRow />
          <SkeletonRow />
        </>
      ) : (
        // A friend watching and reading at once has a row for each.
        activities
          .toSorted(byRecency)
          .map((activity) => (
            <Row
              key={`${activity.friend.id}:${activity.contentType}`}
              activity={activity}
              now={now}
            />
          ))
      )}
    </div>
  );
};

const SignIn = () => {
  const [pending, setPending] = useState(false);
  return (
    <EmptyState
      size="sm"
      icon={<MaterialSymbolsGroupOutlineRounded />}
      title="Увійдіть у розширення"
      description="Щоб бачити, що зараз дивляться й читають друзі, з якими ви взаємно підписані"
      action={
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={pending}
          onClick={() => {
            setPending(true);
            account
              .login()
              .catch(console.error)
              .finally(() => setPending(false));
          }}
        >
          {pending ? <Spinner /> : <MaterialSymbolsLoginRounded />}
          Увійти через hikka.io
        </Button>
      }
    />
  );
};

/** What the user's friends are watching and reading in the extension. */
const FriendsActivityBlock = () => {
  const mode = useMode();

  useEffect(() => {
    useBlockView.setState({ visible: mode !== 'hidden' });
  }, [mode]);

  if (mode === 'hidden') return null;

  return (
    // hikka.io's widget: the header above a card, which goes edge to edge on
    // phones in the centre column.
    <section className="flex min-w-0 flex-col gap-3">
      <BlockHeader title={BLOCK_TITLE} icon={<HFLogo />} />
      <div className="surface border-border relative isolate flex min-w-0 flex-col gap-4 overflow-clip rounded-lg border p-4 [:host([data-bleed])_&]:max-md:-mx-4 [:host([data-bleed])_&]:max-md:rounded-none [:host([data-bleed])_&]:max-md:border-x-0">
        {mode === 'friends' ? (
          <>
            <FriendsList />
            <SharingFooter />
          </>
        ) : (
          <SignIn />
        )}
      </div>
    </section>
  );
};

export default FriendsActivityBlock;
