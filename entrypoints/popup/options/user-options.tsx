import { useState } from 'react';
import MaterialSymbolsLoginRounded from '~icons/material-symbols/login-rounded';
import MaterialSymbolsPersonRounded from '~icons/material-symbols/person-rounded';

import HikkaLogo from '@/assets/hikka_logo.svg';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Login, Logout } from '@/utils/hikka-integration';

const authErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('WXT_CONVEX_SITE_URL')) {
    return 'Сервер входу не налаштований у цій збірці.';
  }
  if (message.includes('cancel') || message.includes('closed')) {
    return 'Вхід скасовано.';
  }
  if (message.includes('invalid_redirect_uri')) {
    return 'Цю версію розширення ще не дозволено на сервері.';
  }
  return message || 'Не вдалося увійти. Спробуйте ще раз.';
};

const UserOptions = () => {
  const { convexSession, userData } = useSettings();
  const [pending, setPending] = useState<'login' | 'logout'>();
  const [error, setError] = useState<string>();

  const run = async (action: 'login' | 'logout') => {
    setPending(action);
    setError(undefined);
    try {
      await (action === 'login' ? Login() : Logout());
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setPending(undefined);
    }
  };

  // Errors replace the description, so the row never changes height.
  const description = (text: string) =>
    error ? (
      <span role="alert" className="text-destructive text-xs font-medium">
        {error}
      </span>
    ) : (
      <span className="text-xs font-medium text-pretty text-[#A1A1A1]">
        {text}
      </span>
    );

  if (convexSession && userData) {
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar className="rounded-md">
          <AvatarImage src={userData.avatar} alt="" />
          <AvatarFallback>
            <MaterialSymbolsPersonRounded className="size-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-sm font-medium">
            {userData.username}
          </span>
          {description('Обрані команди синхронізуються')}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive min-w-15"
          disabled={Boolean(pending)}
          onClick={() => run('logout')}
        >
          {pending === 'logout' ? <Spinner /> : 'Вийти'}
        </Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={Boolean(pending)}
      onClick={() => run('login')}
      className="group/row hover:bg-accent/30 flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-[background-color] disabled:cursor-progress disabled:hover:bg-transparent"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-black">
        <img src={HikkaLogo} className="size-8" alt="" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm font-medium">Увійти через hikka.io</span>
        {description(
          pending === 'login'
            ? 'Завершіть вхід у вікні hikka.io'
            : 'Синхронізація обраних команд',
        )}
      </span>
      {pending === 'login' ? (
        <Spinner className="text-muted-foreground size-5" />
      ) : (
        <MaterialSymbolsLoginRounded className="text-muted-foreground size-5 shrink-0 transition-transform group-hover/row:translate-x-0.5" />
      )}
    </button>
  );
};

export default UserOptions;
