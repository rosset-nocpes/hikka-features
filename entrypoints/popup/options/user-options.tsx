import { useEffect, useState } from 'react';
import HikkaLogo from '@/assets/hikka_logo.svg';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Logout } from '@/utils/hikka-integration';
import MaterialSymbolsExitToAppRounded from '~icons/material-symbols/exit-to-app-rounded';
import MaterialSymbolsPersonRounded from '~icons/material-symbols/person-rounded';
import MdiBeta from '~icons/mdi/beta';

const UserOptions = () => {
  const [getRichPresence, toggleRichPresence] = useState<boolean | null>(null);

  const [getUserData, setUserData] = useState<any>(null);

  useEffect(() => {
    Promise.all([richPresence.getValue(), userData.getValue()]).then(
      ([richPresence, userData]) => {
        toggleRichPresence(richPresence);
        setUserData(userData);
      },
    );

    hikkaSecret.watch(async () => {
      setUserData(await userData.getValue());
    });
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled>
        <Avatar className="pointer-events-none">
          <AvatarImage src={getUserData?.avatar} />
          <AvatarFallback>
            {/* <MaterialSymbolsPersonRounded className="size-5" /> */}
            WIP
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!getUserData && (
          <DropdownMenuItem onClick={Login} className="items-center gap-2">
            <img src={HikkaLogo} className="size-5 rounded-sm" />
            Увійти в акаунт hikka.io
          </DropdownMenuItem>
        )}
        {getUserData && (
          <>
            <DropdownMenuLabel className="-m-1 line-clamp-1 bg-secondary/30 p-2">
              {getUserData?.username}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={Logout} className="items-center gap-2">
              <MaterialSymbolsExitToAppRounded className="text-destructive" />
              Вийти з акаунта
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex gap-2">
                Фічі
                <Badge
                  variant="outline"
                  className="cursor-default bg-yellow-500 text-primary-foreground"
                >
                  <MdiBeta />
                  Beta
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={getRichPresence!}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={(e) => {
                  richPresence.setValue(e);
                  toggleRichPresence(e);
                }}
              >
                Rich Presence
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserOptions;
