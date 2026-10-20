import { useEffect, useId, useState } from 'react';
import MaterialSymbolsGroupOutlineRounded from '~icons/material-symbols/group-outline-rounded';
import MaterialSymbolsLoginRounded from '~icons/material-symbols/login-rounded';
import MaterialSymbolsPauseRounded from '~icons/material-symbols/pause-rounded';
import MaterialSymbolsVisibilityOffOutlineRounded from '~icons/material-symbols/visibility-off-outline-rounded';
import MaterialSymbolsVisibilityOutlineRounded from '~icons/material-symbols/visibility-outline-rounded';

import type { FriendActivity } from '@/utils/convex-api';

import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { useHikkaContent } from '@/hooks/use-hikka';
import { useLiveQuery } from '@/hooks/use-live-query';
import { useSettings } from '@/hooks/use-settings';
import { convexApi } from '@/utils/convex-api';
import { refreshFriends, withLiveClient } from '@/utils/convex-client';
import { Login } from '@/utils/hikka-integration';
import { useHikkaViewer } from '@/utils/hikka-viewer';

import { memberName } from '../player/watch-together/menu';
import { openRoom } from '../player/watch-together/open-room';
import { useBlockView } from './home-placement';
import { BLOCK_TITLE, LOGO_PATHS } from './site-layout';

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

const Row = ({ activity }: { activity: FriendActivity }) => {
  const { friend, animeSlug, episode, playing, room } = activity;
  const { data: anime } = useHikkaContent('anime', animeSlug);
  const title: string = hikkaTitle(anime) || animeSlug;
  const name = memberName(friend);
  const href = `/anime/${animeSlug}`;

  return (
    <div className="hover:bg-accent/50 flex items-center gap-3 px-4 py-2 transition-colors">
      <a href={href} className="w-12 shrink-0">
        <AspectRatio
          ratio={0.7}
          className="bg-muted overflow-hidden rounded-md"
        >
          {anime?.image && (
            <img
              src={anime.image}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          )}
        </AspectRatio>
      </a>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <a
          href={friend.username ? `/u/${friend.username}` : undefined}
          className="text-muted-foreground hover:text-foreground flex min-w-0 items-center gap-2 text-xs transition-colors"
        >
          <Avatar size="sm" className="data-[size=sm]:size-5">
            {friend.avatar && <AvatarImage src={friend.avatar} alt="" />}
            <AvatarFallback className="text-[10px]">
              {name[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{name}</span>
        </a>
        <a
          href={href}
          title={title}
          className="line-clamp-1 text-sm leading-snug font-medium hover:underline"
        >
          {title}
        </a>
        <div className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs whitespace-nowrap">
          {playing ? (
            <span
              className="relative flex size-2 shrink-0"
              title="Дивиться зараз"
            >
              <span className="bg-success absolute inline-flex size-full animate-ping rounded-full opacity-60" />
              <span className="bg-success relative inline-flex size-2 rounded-full" />
            </span>
          ) : (
            <MaterialSymbolsPauseRounded
              className="size-3.5 shrink-0"
              aria-label="На паузі"
            />
          )}
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
                onClick={() => openRoom(animeSlug, room.code!)}
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
        </div>
      </div>
    </div>
  );
};

const SkeletonRow = () => (
  <div className="flex items-center gap-3 px-4 py-2">
    <Skeleton className="aspect-[0.7] w-12 shrink-0" />
    <div className="flex flex-1 flex-col gap-2">
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

/** The user's own sharing, opened from the header's eye button. */
const SharingSettings = () => {
  const id = useId();
  const sharing = useLiveQuery(convexApi.activity.settings, {})?.data
    ?.shareActivity;
  const [pending, setPending] = useState<boolean>();

  const toggle = (shareActivity: boolean) => {
    setPending(shareActivity);
    // Resolves once the live query shows it.
    void withLiveClient((client) =>
      client.mutation(convexApi.activity.setSharing, { shareActivity }),
    )
      .catch(console.error)
      .finally(() => setPending(undefined));
  };

  return (
    <div className="bg-muted/40 flex items-start gap-3 rounded-md border p-3">
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor={id}>Ділитися активністю</Label>
        <p className="text-muted-foreground text-xs text-pretty">
          Друзі бачать, що ви дивитеся у програвачі розширення
        </p>
      </div>
      <Switch
        id={id}
        checked={pending ?? sharing ?? false}
        disabled={sharing === undefined || pending !== undefined}
        onCheckedChange={toggle}
      />
    </div>
  );
};

/** The extension's mark, drawn in the text colour so either theme works. */
const Mark = () => (
  <svg
    viewBox="0 0 21 20"
    fill="none"
    aria-label="Hikka Features"
    className="h-5 w-[21px] shrink-0"
  >
    {LOGO_PATHS.map(([d, fill]) => (
      <path key={d} d={d} fill={fill} />
    ))}
  </svg>
);

const FriendsList = () => {
  const activities = useLiveQuery(convexApi.activity.friends, {})?.data;

  // Friends are the mutual follows among extension users; read them again
  // now and then (the server limits how often).
  useEffect(() => {
    void refreshFriends();
  }, []);

  if (activities?.length === 0) {
    return (
      <EmptyState
        size="sm"
        icon={<MaterialSymbolsGroupOutlineRounded />}
        title="Зараз ніхто не дивиться"
        description="Тут з’являться друзі з розширенням, з якими ви взаємно підписані, коли вмикатимуть аніме"
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
        activities.map((activity) => (
          <Row key={activity.friend.id} activity={activity} />
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
      description="Щоб бачити, що зараз дивляться друзі, з якими ви взаємно підписані"
      action={
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          disabled={pending}
          onClick={() => {
            setPending(true);
            Login()
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

/** What the user's friends are watching in the extension's player. */
const FriendsActivityBlock = () => {
  const mode = useMode();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const sharing = useLiveQuery(
    convexApi.activity.settings,
    mode === 'friends' ? {} : 'skip',
  )?.data?.shareActivity;

  useEffect(() => {
    useBlockView.setState({ visible: mode !== 'hidden' });
  }, [mode]);

  if (mode === 'hidden') return null;

  const SharingIcon =
    sharing === false
      ? MaterialSymbolsVisibilityOffOutlineRounded
      : MaterialSymbolsVisibilityOutlineRounded;

  return (
    // The site's own cards are see-through (`--surface`, which the extension
    // doesn't define, so it comes from the page), and edge to edge on phones
    // in the centre column.
    <Card className="flex flex-col gap-4 overflow-hidden bg-[var(--surface,var(--card))] p-4 [:host([data-bleed])_&]:max-sm:rounded-none [:host([data-bleed])_&]:max-sm:border-x-0">
      <CardHeader className="min-h-8 flex-row items-center gap-2 space-y-0 p-0">
        <CardTitle className="text-lg leading-7 font-bold tracking-normal">
          {BLOCK_TITLE}
        </CardTitle>
        <Mark />
        {mode === 'friends' && sharing !== undefined && (
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Моя активність"
            aria-expanded={settingsOpen}
            title={
              sharing
                ? 'Друзі бачать вашу активність'
                : 'Ваша активність прихована'
            }
            className={cn('ml-auto', !sharing && 'text-muted-foreground')}
            onClick={() => setSettingsOpen((open) => !open)}
          >
            <SharingIcon className="size-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-0">
        {mode === 'friends' && settingsOpen && <SharingSettings />}
        {mode === 'friends' ? <FriendsList /> : <SignIn />}
      </CardContent>
    </Card>
  );
};

export default FriendsActivityBlock;
