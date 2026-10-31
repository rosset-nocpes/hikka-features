import { useEffect, useId, useState } from 'react';
import MaterialSymbolsGroupOutlineRounded from '~icons/material-symbols/group-outline-rounded';
import MaterialSymbolsLoginRounded from '~icons/material-symbols/login-rounded';
import MaterialSymbolsMenuBookOutlineRounded from '~icons/material-symbols/menu-book-outline-rounded';
import MaterialSymbolsPauseRounded from '~icons/material-symbols/pause-rounded';
import MaterialSymbolsPlayArrowRounded from '~icons/material-symbols/play-arrow-rounded';
import MaterialSymbolsVisibilityOffOutlineRounded from '~icons/material-symbols/visibility-off-outline-rounded';
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

type Watching = Extract<FriendActivity, { contentType: 'anime' }>;
type Reading = Exclude<FriendActivity, Watching>;

/** The episode, and the watch together room. */
const WatchingFacts = ({ activity }: { activity: Watching }) => {
  const { slug, episode, playing, room } = activity;
  return (
    <>
      <span className="shrink-0">Епізод {episode}</span>
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
      {room?.code ? (
        <>
          <Dot />
          <Button
            variant="link"
            className="h-auto min-w-0 p-0 text-xs"
            onClick={() => openRoom(slug, room.code!)}
          >
            <span className="truncate">Приєднатися</span>
          </Button>
        </>
      ) : (
        !playing && (
          <>
            <Dot />
            <span className="truncate">на паузі</span>
          </>
        )
      )}
    </>
  );
};

/** The chapter open in the reader, and its volume. */
const ReadingFacts = ({ activity }: { activity: Reading }) => (
  <>
    {activity.volume ? (
      <>
        <span className="shrink-0">Том {activity.volume}</span>
        <Dot />
      </>
    ) : null}
    <span className="truncate">Розділ {activity.chapter}</span>
  </>
);

/** What the friend is doing, as a badge on their avatar. */
const STATE = {
  playing: {
    Icon: MaterialSymbolsPlayArrowRounded,
    label: 'Дивиться зараз',
    tone: 'bg-success text-success-foreground',
  },
  paused: {
    Icon: MaterialSymbolsPauseRounded,
    label: 'На паузі',
    tone: 'bg-secondary text-muted-foreground',
  },
  reading: {
    Icon: MaterialSymbolsMenuBookOutlineRounded,
    label: 'Читає',
    tone: 'bg-secondary text-muted-foreground',
  },
};

/** The friend's avatar, as hikka.io's activity widget shows its users. */
const FriendNode = ({ activity }: { activity: FriendActivity }) => {
  const { friend } = activity;
  const name = memberName(friend);
  const { Icon, label, tone } =
    STATE[
      activity.contentType !== 'anime'
        ? 'reading'
        : activity.playing
          ? 'playing'
          : 'paused'
    ];

  return (
    <a
      href={friend.username ? `/u/${friend.username}` : undefined}
      aria-label={`${name}: ${label.toLowerCase()}`}
      title={name}
      className="relative size-8 shrink-0"
    >
      <Avatar className="size-8 rounded-md after:rounded-md">
        {friend.avatar && (
          <AvatarImage className="rounded-md" src={friend.avatar} alt="" />
        )}
        <AvatarFallback className="rounded-md text-xs">
          {name[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span
        title={label}
        className={cn(
          'absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-sm',
          tone,
        )}
      >
        <Icon className="size-2.5" />
      </span>
    </a>
  );
};

/** Avatar and poster side by side, the title and progress beside them. */
const Row = ({ activity }: { activity: FriendActivity }) => {
  const { contentType, slug } = activity;
  const { data: content } = useHikkaContent(contentType, slug);
  const title: string = hikkaTitle(content) || slug;
  const href = `/${contentType}/${slug}`;

  return (
    <div className="flex items-start gap-4">
      <div className="flex shrink-0 items-center gap-3">
        <FriendNode activity={activity} />
        <a href={href} tabIndex={-1} aria-hidden className="w-12 shrink-0">
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
        </a>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 self-stretch">
        <a
          href={href}
          title={title}
          className="line-clamp-2 text-sm leading-tight font-medium underline-offset-4 hover:underline"
        >
          {title}
        </a>
        <div className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs whitespace-nowrap">
          {activity.contentType === 'anime' ? (
            <WatchingFacts activity={activity} />
          ) : (
            <ReadingFacts activity={activity} />
          )}
        </div>
      </div>
    </div>
  );
};

const SkeletonRow = () => (
  <div className="flex items-start gap-4">
    <div className="flex shrink-0 items-center gap-3">
      <Skeleton className="size-8 shrink-0 rounded-md" />
      <Skeleton className="aspect-[0.7] w-12 shrink-0" />
    </div>
    <div className="flex flex-1 flex-col justify-center gap-2 self-stretch">
      <Skeleton className="h-3.5 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
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

  const Icon = shown
    ? MaterialSymbolsVisibilityOutlineRounded
    : MaterialSymbolsVisibilityOffOutlineRounded;

  return (
    <div className="text-muted-foreground -mx-4 -mb-4 flex items-center gap-2 rounded-b-lg border-t px-4 py-3">
      <Icon className="size-4 shrink-0" />
      <Label
        htmlFor={id}
        className="flex-1"
        title="Друзі бачать, що ви дивитеся й читаєте в розширенні"
      >
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

const FriendsList = () => {
  const activities = useLiveQuery(convexApi.activity.friends, {})?.data;

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
    <div className="flex flex-col gap-6">
      {activities === undefined ? (
        <>
          <SkeletonRow />
          <SkeletonRow />
        </>
      ) : (
        // A friend watching and reading at once has a row for each.
        activities.map((activity) => (
          <Row
            key={`${activity.friend.id}:${activity.contentType}`}
            activity={activity}
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
