import { useState } from 'react';
import MaterialSymbolsExitToAppRounded from '~icons/material-symbols/exit-to-app-rounded';
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

  const login = async () => {
    setPending('login');
    setError(undefined);
    try {
      await Login();
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setPending(undefined);
    }
  };

  const logout = async () => {
    setPending('logout');
    setError(undefined);
    try {
      await Logout();
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setPending(undefined);
    }
  };

  if (convexSession && userData) {
    return (
      <div className="flex flex-col gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={userData.avatar} alt={userData.username} />
            <AvatarFallback>
              <MaterialSymbolsPersonRounded className="size-5" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">
              {userData.username}
            </div>
            <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Синхронізацію увімкнено
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Вийти з акаунта"
            disabled={Boolean(pending)}
            onClick={logout}
          >
            {pending === 'logout' ? (
              <Spinner />
            ) : (
              <MaterialSymbolsExitToAppRounded className="text-destructive" />
            )}
          </Button>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Обрані команди й сповіщення доступні на всіх ваших пристроях.
        </p>
        {error && (
          <p role="alert" className="text-destructive text-xs">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 grid size-10 shrink-0 place-items-center rounded-lg">
          <img src={HikkaLogo} className="size-6 rounded-sm" alt="" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">Акаунт hikka.io</div>
          <div className="text-muted-foreground text-xs">
            Синхронізація обраних команд
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={Boolean(pending)}
          onClick={login}
        >
          {pending === 'login' && <Spinner />}
          Увійти
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
};

export default UserOptions;
