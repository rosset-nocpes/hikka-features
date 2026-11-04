import { useState } from 'react';
import MaterialSymbolsLoginRounded from '~icons/material-symbols/login-rounded';
import MaterialSymbolsPersonRounded from '~icons/material-symbols/person-rounded';

import HikkaLogo from '@/assets/hikka_logo.svg';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { account } from '@/utils/account';

import RowDescription from '../_base/row-description';
import RowLabel from '../_base/row-label';

/** By the error code the login ended with. */
const AUTH_ERRORS: Record<string, string> = {
  cancelled: 'Вхід скасовано.',
  login_expired: 'Час на вхід минув. Спробуйте ще раз.',
  hikka_exchange_failed: 'hikka.io не підтвердила вхід. Спробуйте згодом.',
  account_mismatch: 'Вхід був не за акаунтом, відкритим на hikka.io.',
  hikka_unavailable: 'Не вдалося перевірити акаунт hikka.io. Спробуйте згодом.',
};

const authErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('WXT_CONVEX_SITE_URL')) {
    return 'Сервер входу не налаштований у цій збірці.';
  }
  return AUTH_ERRORS[message] ?? 'Не вдалося увійти. Спробуйте ще раз.';
};

const UserOptions = () => {
  const { convexSession, userData } = useSettings();
  const [pending, setPending] = useState<'login' | 'logout'>();
  const [error, setError] = useState<string>();

  const run = async (action: 'login' | 'logout') => {
    setPending(action);
    setError(undefined);
    try {
      await (action === 'login' ? account.login() : account.logout());
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setPending(undefined);
    }
  };

  // Errors replace the description, so the row never changes height.
  const description = (text: string) =>
    error ? (
      <span role="alert" className="text-destructive text-xs leading-snug">
        {error}
      </span>
    ) : (
      <RowDescription>{text}</RowDescription>
    );

  if (convexSession && userData) {
    return (
      <div className="flex min-h-14 items-center gap-3 px-4 py-3">
        <Avatar className="size-10 rounded-lg">
          <AvatarImage src={userData.avatar} alt="" />
          <AvatarFallback className="rounded-lg">
            <MaterialSymbolsPersonRounded className="size-5" />
          </AvatarFallback>
        </Avatar>
        <RowLabel
          label={<span className="truncate">{userData.username}</span>}
          description={description('Пріоритет команд синхронізується')}
        />
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 min-w-15"
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
      className="group/row hover:bg-accent/40 focus-visible:bg-accent/40 flex min-h-14 w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-[background-color] outline-none disabled:cursor-progress disabled:hover:bg-transparent"
    >
      <span className="border-border/70 grid size-10 shrink-0 place-items-center rounded-lg border bg-black">
        <img src={HikkaLogo} className="size-7" alt="" />
      </span>
      <RowLabel
        label="Увійти через hikka.io"
        description={description(
          pending === 'login'
            ? 'Завершіть вхід у вкладці hikka.io'
            : 'Синхронізація команд і активність друзів',
        )}
      />
      {pending === 'login' ? (
        <Spinner className="text-muted-foreground size-5" />
      ) : (
        <MaterialSymbolsLoginRounded className="text-muted-foreground size-5 shrink-0 transition-transform group-hover/row:translate-x-0.5" />
      )}
    </button>
  );
};

export default UserOptions;
