import MaterialSymbolsExitToAppRounded from '~icons/material-symbols/exit-to-app-rounded';
import MaterialSymbolsPersonRounded from '~icons/material-symbols/person-rounded';
import MdiBeta from '~icons/mdi/beta';

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

const UserOptions = () => {
  const { richPresence, userData, setSettings } = useSettings();
  // const [getRichPresence, toggleRichPresence] = useState<boolean | null>(null);

  // const [getUserData, setUserData] = useState<any>(null);

  // useEffect(() => {
  //   Promise.all([richPresence.getValue(), userData.getValue()]).then(
  //     ([richPresence, userData]) => {
  //       toggleRichPresence(richPresence);
  //       setUserData(userData);
  //     },
  //   );

  //   hikkaSecret.watch(async () => {
  //     setUserData(await userData.getValue());
  //   });
  // }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Avatar className="pointer-events-none">
            <AvatarImage src={userData?.avatar} />
            <AvatarFallback>
              <MaterialSymbolsPersonRounded className="size-5" />
            </AvatarFallback>
          </Avatar>
        }
        disabled
      />
      <DropdownMenuContent align="end">
        {!userData && (
          <DropdownMenuItem onClick={Login} className="items-center gap-2">
            <img src={HikkaLogo} className="size-5 rounded-sm" />
            Увійти в акаунт hikka.io
          </DropdownMenuItem>
        )}
        {userData && (
          <>
            <DropdownMenuLabel className="bg-secondary/30 -m-1 line-clamp-1 p-2">
              {userData?.username}
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
                  className="text-primary-foreground cursor-default bg-yellow-500"
                >
                  <MdiBeta />
                  Beta
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={richPresence}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={(e) => {
                  setSettings({ richPresence: e });
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
