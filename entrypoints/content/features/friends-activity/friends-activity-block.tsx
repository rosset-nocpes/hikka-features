import { useEffect, useId, useState } from 'react';
import MaterialSymbolsGroupOutlineRounded from '~icons/material-symbols/group-outline-rounded';
import MaterialSymbolsLoginRounded from '~icons/material-symbols/login-rounded';
import MaterialSymbolsVisibilityOffOutlineRounded from '~icons/material-symbols/visibility-off-outline-rounded';
import MaterialSymbolsVisibilityOutlineRounded from '~icons/material-symbols/visibility-outline-rounded';

import type { FriendActivity } from '@/utils/convex-api';

import { HFLogo } from '@/components/feature-card';
import BlockHeader from '@/components/hikka/block-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Hint } from '@/components/ui/tooltip';
import { useActivitySharing } from '@/hooks/use-activity-sharing';
import { useHikkaContent } from '@/hooks/use-hikka';
import { useLiveQuery } from '@/hooks/use-live-query';
import { useSettings } from '@/hooks/use-settings';
import { account } from '@/utils/account';
import { convexApi } from '@/utils/convex-api';
import { useHikkaViewer } from '@/utils/hikka-viewer';
import { plural } from '@/utils/plural';
import { formatTimestamp } from '@/utils/time';

import { memberName } from '../player/watch-together/menu';
import { openRoom } from '../player/watch-together/open-room';
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

const UNITS = {
  episode: { one: 'епізод', few: 'епізоди', many: 'епізодів' },
  chapter: { one: 'розділ', few: 'розділи', many: 'розділів' },
  viewer: { one: 'глядач', few: 'глядачі', many: 'глядачів' },
};

/** Re-renders now and then, so "5 хв тому" keeps up. */
function useNow() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

const isPlaying = (activity: FriendActivity) =>
  activity.contentType === 'anime' && activity.playing;

/** Who is watching right now first, then whoever was here last. */
const byRecency = (a: FriendActivity, b: FriendActivity) =>
  Number(isPlaying(b)) - Number(isPlaying(a)) || b.updatedAt - a.updatedAt;

const Dot = () => (
  <span aria-hidden className="opacity-60">
    ·
  </span>
);

/**
 * "7 / 28 епізодів", as hikka.io words progress. A number past the title's
 * total (sources number chapters their own way) stands alone: "Розділ 140".
 */
const Progress = ({
  current,
  total,
  unit,
}: {
  current: number;
  total?: number | null;
  unit: 'episode' | 'chapter';
}) => {
  if (total && current > total) {
    return (
      <span className="shrink-0">
        {unit === 'episode' ? 'Епізод' : 'Розділ'}{' '}
        <span className="text-foreground font-medium tabular-nums">
          {current}
        </span>
      </span>
    );
  }
  return (
    <span className="shrink-0 tabular-nums">
      <span className="text-foreground font-medium">{current}</span> /{' '}
      {total || '?'} {total ? plural(total, UNITS[unit]) : UNITS[unit].many}
    </span>
  );
};

const viewers = (count: number) => `${count} ${plural(count, UNITS.viewer)}`;

/** A friend's watch together room they let friends into, to join. */
const RoomInvite = ({
  slug,
  code,
  memberCount,
}: {
  slug: string;
  code: string;
  memberCount: number;
}) => {
  const [pending, setPending] = useState(false);
  return (
    <div className="bg-secondary/60 relative z-10 mt-1.5 flex min-w-0 items-center gap-2 rounded-md py-1 pr-1 pl-2 text-xs">
      <MaterialSymbolsGroupOutlineRounded
        aria-hidden
        className="text-muted-foreground size-4 shrink-0"
      />
      <span className="min-w-0 flex-1 truncate">{memberCount} у кімнаті</span>
      <Button
        size="sm"
        className="h-6 shrink-0 gap-1 rounded-sm px-2 text-xs"
        disabled={pending}
        onClick={() => {
          setPending(true);
          openRoom(slug, code)
            .catch(console.error)
            .finally(() => setPending(false));
        }}
      >
        {pending && <Spinner className="size-3" />}
        Приєднатися
      </Button>
    </div>
  );
};

/**
 * One friend and what they have open: who, doing what and since when on top,
 * then the title and how far in, beside its poster; below, the room they
 * watch in, when the user may join it. The whole row opens the title.
 */
const Row = ({ activity, now }: { activity: FriendActivity; now: number }) => {
  const { friend, contentType, slug } = activity;
  const { data: content, isLoading } = useHikkaContent(contentType, slug);
  const title: string = hikkaTitle(content) || slug;
  const name = memberName(friend);
  const watching = activity.contentType === 'anime' ? activity : undefined;
  const live = isPlaying(activity);
  const time = formatTimestamp(activity.updatedAt, now);
  const room = watching?.room;

  return (
    <li className="hover:bg-accent/60 relative flex gap-3 px-4 py-2.5 transition-colors">
      <div className="bg-muted aspect-[0.7] w-12 shrink-0 self-start overflow-hidden rounded-md">
        {content?.image && (
          <img
            src={content.image}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <p className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs leading-4">
          <a
            href={friend.username ? `/u/${friend.username}` : undefined}
            className="text-foreground relative z-10 flex min-w-0 items-center gap-1.5 font-medium hover:underline"
          >
            <Avatar className="size-4 shrink-0">
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
          <Hint label={time.full}>
            <time
              dateTime={time.iso}
              className={cn(
                'ml-auto shrink-0 pl-1 tabular-nums',
                live ? 'text-foreground' : 'opacity-70',
              )}
            >
              {live ? 'зараз' : time.label}
            </time>
          </Hint>
        </p>

        <Hint label={title}>
          <a
            href={`/${contentType}/${slug}`}
            className="line-clamp-1 text-sm leading-5 font-medium after:absolute after:inset-0"
          >
            {isLoading ? <Skeleton className="my-0.5 h-4 w-3/4" /> : title}
          </a>
        </Hint>

        <p className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs leading-4 whitespace-nowrap">
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
          {room && !room.code && (
            <>
              <Dot />
              <Hint label={`Дивляться разом: ${viewers(room.memberCount)}`}>
                <span className="relative z-10 flex shrink-0 items-center gap-1">
                  <MaterialSymbolsGroupOutlineRounded
                    aria-hidden
                    className="size-3.5"
                  />
                  {room.memberCount}
                </span>
              </Hint>
            </>
          )}
        </p>

        {room?.code && (
          <RoomInvite
            slug={slug}
            code={room.code}
            memberCount={room.memberCount}
          />
        )}
      </div>
    </li>
  );
};

const SkeletonRow = () => (
  <li className="flex gap-3 px-4 py-2.5">
    <Skeleton className="aspect-[0.7] w-12 shrink-0 rounded-md" />
    <div className="flex flex-1 flex-col justify-center gap-2">
      <div className="flex items-center gap-1.5">
        <Skeleton className="size-4 rounded-full" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  </li>
);

/** The user's own sharing, in the card's footer as the site's tracker has. */
const SharingFooter = () => {
  const id = useId();
  const { shared, pending, error, setShared } = useActivitySharing();
  const Icon =
    shared === false
      ? MaterialSymbolsVisibilityOffOutlineRounded
      : MaterialSymbolsVisibilityOutlineRounded;

  return (
    <div className="flex items-center gap-3 border-t px-4 py-3">
      <Icon aria-hidden className="text-muted-foreground size-5 shrink-0" />
      <label
        htmlFor={id}
        className="flex min-w-0 flex-1 cursor-pointer flex-col gap-0.5"
      >
        <span className="text-sm leading-5 font-medium">
          Ділитися моєю активністю
        </span>
        {error && shared === undefined ? (
          <span role="alert" className="text-destructive text-xs leading-4">
            Не вдалося завантажити налаштування
          </span>
        ) : (
          <span className="text-muted-foreground text-xs leading-4">
            {shared === false
              ? 'Друзі не бачать, що ви дивитесь і читаєте'
              : 'Друзі бачать, що ви дивитесь і читаєте'}
          </span>
        )}
      </label>
      <Switch
        id={id}
        checked={shared ?? false}
        disabled={shared === undefined || pending}
        onCheckedChange={setShared}
      />
    </div>
  );
};

const FriendsList = () => {
  const { data: activities, error } =
    useLiveQuery(convexApi.activity.friends, {}) ?? {};
  const now = useNow();

  // Friends are the mutual follows among extension users; read them again
  // now and then (the server limits how often).
  useEffect(() => {
    void account.refreshFriends();
  }, []);

  // A later result replaces the error, e.g. once the connection signs in.
  if (error && activities === undefined) {
    return (
      <EmptyState
        size="sm"
        icon={<MaterialSymbolsGroupOutlineRounded />}
        title="Не вдалося завантажити активність друзів"
        description="Спробуйте оновити сторінку"
      />
    );
  }

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
    <ul className="flex flex-col py-1.5">
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
    </ul>
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
      <div className="surface border-border relative isolate flex min-w-0 flex-col overflow-clip rounded-lg border [:host([data-bleed])_&]:max-md:-mx-4 [:host([data-bleed])_&]:max-md:rounded-none [:host([data-bleed])_&]:max-md:border-x-0">
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
