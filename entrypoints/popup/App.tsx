import HikkaLogo from '@/assets/hikka_logo.svg';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { version } from '@/package.json';
import { Logout } from '@/utils/hikka-integration';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import MaterialSymbolsExitToAppRounded from '~icons/material-symbols/exit-to-app-rounded';
import MaterialSymbolsExpandAllRounded from '~icons/material-symbols/expand-all-rounded';
import MaterialSymbolsExperiment from '~icons/material-symbols/experiment';
import MaterialSymbolsPersonRounded from '~icons/material-symbols/person-rounded';
import MdiBeta from '~icons/mdi/beta';
import MdiGithub from '~icons/mdi/github';
import MdiTelegram from '~icons/mdi/telegram';
import '../app.css';

function App() {
  const [showDevOptions, toggleDevOptions] = useState<boolean | null>(null);

  const [showAniBackground, toggleAniBackground] = useState<boolean | null>(
    null,
  );

  const [showLocalizedPosterButton, toggleLocalizedPosterButton] = useState<
    boolean | null
  >(null);

  const [showLocalizedPoster, toggleLocalizedPoster] = useState<boolean | null>(
    null,
  );

  const [showAniButtons, toggleAniButtons] = useState<boolean | null>(null);

  const [showFandubBlock, toggleFandubBlock] = useState<boolean | null>(null);

  const [showWatchButton, toggleWatchButton] = useState<boolean | null>(null);

  const [defaultPlayerProvider, setDefaultPlayerProvider] =
    useState<PlayerSource | null>(null);

  const [getBurunyaaMode, toggleBurunyaaMode] = useState<boolean | null>(null);

  const [getBackendBranch, setBackendBranch] = useState<BackendBranches | null>(
    null,
  );

  const [getRichPresence, toggleRichPresence] = useState<boolean | null>(null);

  const [getUserData, setUserData] = useState<any | null>(null);

  useEffect(() => {
    // Initialize all states in parallel
    Promise.all([
      devOptionsState.getValue(),
      aniBackState.getValue(),
      localizedPosterButtonState.getValue(),
      localizedPosterState.getValue(),
      aniButtonsState.getValue(),
      fandubBlockState.getValue(),
      watchButtonState.getValue(),
      defaultPlayer.getValue(),
      burunyaaMode.getValue(),
      backendBranch.getValue(),
      richPresence.getValue(),
      userData.getValue(),
    ]).then(
      ([
        devOptions,
        aniBackground,
        localizedPosterButton,
        localizedPoster,
        aniButtons,
        fandubBlock,
        watchButton,
        defaultPlayerValue,
        burunyaaMode,
        backendBranch,
        richPresence,
        userData,
      ]) => {
        toggleDevOptions(devOptions);
        toggleAniBackground(aniBackground);
        toggleLocalizedPosterButton(localizedPosterButton);
        toggleLocalizedPoster(localizedPoster);
        toggleAniButtons(aniButtons);
        toggleFandubBlock(fandubBlock);
        toggleWatchButton(watchButton);
        setDefaultPlayerProvider(defaultPlayerValue);
        toggleBurunyaaMode(burunyaaMode);
        setBackendBranch(backendBranch);
        toggleRichPresence(richPresence);
        setUserData(userData);
      },
    );

    hikkaSecret.watch(async () => {
      setUserData(await userData.getValue());
    });
  }, []);

  let devClicked = 0;

  return (
    <div data-vaul-drawer-wrapper>
      <style>
        {`:root { background-color: black; } 
        .slide-fade-enter-active {
          transition: all 0.3s ease;
        }
        .slide-fade-exit-active {
          transition: all 0.1s cubic-bezier(1, 0.5, 0.8, 1);
        }
        .slide-fade-enter,
        .slide-fade-exit-to {
          transform: translateX(10px);
          opacity: 0;
        }`}
      </style>
      <div
        className={cn(
          'dark flex w-[400px] flex-col gap-7 rounded-none p-[30px] font-inter font-semibold text-white',
          getBurunyaaMode
            ? 'bg-[url(https://media1.tenor.com/m/PDzKPqFw6f8AAAAC/neco-neco-arc.gif)]'
            : 'bg-black',
        )}
      >
        <h3 className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg font-bold tracking-normal">
            Налаштування
            <AnimatePresence>
              {showDevOptions && (
                <Drawer>
                  <DrawerTrigger>
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <MaterialSymbolsExperiment />
                    </motion.span>
                  </DrawerTrigger>
                  <DrawerContent className="dark text-white">
                    <div className="mx-auto w-full max-w-sm">
                      <DrawerHeader>
                        <DrawerTitle>Експерементальні функції</DrawerTitle>
                      </DrawerHeader>
                      <div className="flex flex-col gap-5 px-[30px]">
                        <div className="flex items-center justify-between">
                          <div className="mr-10 flex flex-col gap-1">
                            <Label>Burunyaa режим</Label>
                            <p className="text-xs font-medium text-[#A1A1A1]">
                              Burunyaaaaaa
                            </p>
                          </div>
                          <Switch
                            checked={getBurunyaaMode!}
                            onClick={() => {
                              burunyaaMode.setValue(!getBurunyaaMode);
                              toggleBurunyaaMode(!getBurunyaaMode);
                            }}
                            className="flex items-center justify-between"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            Гілка бекенду
                          </label>
                          <select
                            className="h-10 rounded-md border bg-transparent px-3 py-1"
                            value={getBackendBranch!}
                            onChange={(e) => {
                              const target = e.target.value as BackendBranches;
                              backendBranch.setValue(target);
                              setBackendBranch(target);
                            }}
                          >
                            {['stable', 'beta', 'localhost'].map((elem) => (
                              <option
                                key={elem}
                                className="bg-black"
                                value={elem}
                              >
                                {elem}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <DrawerFooter>
                        <DrawerClose>
                          <Button className="w-full" variant="outline">
                            Зачинити
                          </Button>
                        </DrawerClose>
                      </DrawerFooter>
                    </div>
                  </DrawerContent>
                </Drawer>
              )}
            </AnimatePresence>
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarImage src={getUserData?.['avatar']} />
                <AvatarFallback>
                  {getUserData?.['avatar'] || <MaterialSymbolsPersonRounded />}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="dark" align="end">
              {!getUserData && (
                <DropdownMenuItem
                  onClick={Login}
                  className="items-center gap-2"
                >
                  <img src={HikkaLogo} className="size-5 rounded-sm" />
                  Увійти в акаунт hikka.io
                </DropdownMenuItem>
              )}
              {getUserData && (
                <>
                  <DropdownMenuLabel className="-m-1 line-clamp-1 bg-secondary/30 p-2">
                    {getUserData!['username']}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={Logout}
                    className="items-center gap-2"
                  >
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
        </h3>
        <div className="flex flex-col gap-5">
          <Drawer>
            <div className="flex justify-between">
              <div className="mr-10 flex flex-col gap-1">
                <label className="text-sm font-medium">Плеєр</label>
                <div className="text-xs font-medium text-[#A1A1A1]">
                  Налаштування плеєра
                </div>
              </div>
              <DrawerTrigger>
                <Button size="icon-sm">
                  <MaterialSymbolsExpandAllRounded />
                </Button>
              </DrawerTrigger>
            </div>
            <DrawerContent className="dark text-white">
              <div className="mx-auto w-full max-w-sm">
                <DrawerHeader>
                  <DrawerTitle>Налаштування плеєра</DrawerTitle>
                </DrawerHeader>
                <div className="flex flex-col gap-5 px-[30px]">
                  <div className="flex items-center justify-between">
                    <div className="mr-10 flex flex-col gap-1">
                      <Label>Кнопка перегляду</Label>
                      <p className="text-xs font-medium text-[#A1A1A1]">
                        Кнопка для відображення плеєру
                      </p>
                    </div>
                    <Switch
                      checked={showWatchButton!}
                      onClick={() => {
                        watchButtonState.setValue(!showWatchButton);
                        toggleWatchButton(!showWatchButton);
                      }}
                      className="flex items-center justify-between"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Плеєр за замовчуванням
                    </label>
                    <select
                      className="h-10 rounded-md border bg-transparent px-3 py-1"
                      value={defaultPlayerProvider!}
                      onChange={(e) => {
                        const target = e.target.value as PlayerSource;
                        defaultPlayer.setValue(target);
                        setDefaultPlayerProvider(target);
                      }}
                    >
                      {['moon', 'ashdi'].map((elem) => (
                        <option key={elem} className="bg-black" value={elem}>
                          {elem.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <DrawerFooter>
                  <DrawerClose>
                    <Button className="w-full" variant="outline">
                      Зачинити
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
          <div className="flex items-center justify-between">
            <div className="mr-10 flex flex-col gap-1">
              <Label>Інші джерела</Label>
              <p className="text-xs font-medium text-[#A1A1A1]">
                Додаткові посилання на сторінках тайтлів
              </p>
            </div>
            <Switch
              checked={showAniButtons!}
              onClick={() => {
                aniButtonsState.setValue(!showAniButtons);
                toggleAniButtons(!showAniButtons);
              }}
              className="flex items-center justify-between"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="mr-10 flex flex-col gap-1">
              <Label>Блок фандаб команд</Label>
              <p className="text-xs font-medium text-[#A1A1A1]">
                Посилання на фандаб команди, які озвучили аніме тайтл
              </p>
            </div>
            <Switch
              checked={showFandubBlock!}
              onClick={() => {
                fandubBlockState.setValue(!showFandubBlock);
                toggleFandubBlock(!showFandubBlock);
              }}
              className="flex items-center justify-between"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="mr-10 flex flex-col gap-1">
              <Label>Обкладинки</Label>
              <p className="text-xs font-medium text-[#A1A1A1]">
                Покращене оформлення на сторінках тайтлів, персонажів та правок
              </p>
            </div>
            <Switch
              checked={showAniBackground!}
              onClick={() => {
                aniBackState.setValue(!showAniBackground);
                toggleAniBackground(!showAniBackground);
              }}
              className="flex items-center justify-between"
            />
          </div>
          <Drawer>
            <div className="flex justify-between">
              <div className="mr-10 flex flex-col gap-1">
                <label className="text-sm font-medium">
                  Локалізовані постери
                </label>
                <div className="text-xs font-medium text-[#A1A1A1]">
                  Налаштування локалізованих постерів
                </div>
              </div>
              <DrawerTrigger>
                <Button size="icon-sm">
                  <MaterialSymbolsExpandAllRounded />
                </Button>
              </DrawerTrigger>
            </div>
            <DrawerContent className="dark text-white">
              <div className="mx-auto w-full max-w-sm">
                <DrawerHeader>
                  <DrawerTitle>Локалізовані постери</DrawerTitle>
                </DrawerHeader>
                <div className="flex flex-col gap-5 px-[30px]">
                  <div className="flex items-center justify-between">
                    <div className="mr-10 flex flex-col gap-1">
                      <Label>Кнопка локалізації постера</Label>
                    </div>
                    <Switch
                      checked={showLocalizedPosterButton!}
                      onClick={() => {
                        localizedPosterButtonState.setValue(
                          !showLocalizedPosterButton,
                        );
                        toggleLocalizedPosterButton(!showLocalizedPosterButton);
                      }}
                      className="flex items-center justify-between"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="mr-10 flex flex-col gap-1">
                      <Label>Авто-локалізація постера</Label>
                      <p className="text-xs font-medium text-[#A1A1A1]">
                        Автоматично замінює постер локалізованою версією
                      </p>
                    </div>
                    <Switch
                      checked={showLocalizedPoster!}
                      onClick={() => {
                        localizedPosterState.setValue(!showLocalizedPoster);
                        toggleLocalizedPoster(!showLocalizedPoster);
                      }}
                      className="flex items-center justify-between"
                    />
                  </div>
                </div>
                <DrawerFooter>
                  <DrawerClose>
                    <Button className="w-full" variant="outline">
                      Зачинити
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
        <div className="flex items-center justify-between gap-1 text-xs text-[#5C5C5C]">
          <a
            href="https://github.com/rosset-nocpes/hikka-features"
            className="flex items-center gap-1 font-bold"
          >
            <MdiGithub />
            GitHub
          </a>
          <a className="cursor-default">/</a>
          <button
            onClick={() => {
              devClicked++;
              if (devClicked === 5) {
                devOptionsState.setValue(!showDevOptions);
                toggleDevOptions(!showDevOptions);
                devClicked = 0;
              }
            }}
          >
            v{version}
          </button>
          <a className="cursor-default">/</a>
          <a
            href="https://t.me/hikka_features"
            className="flex items-center gap-1 font-bold"
          >
            <MdiTelegram />
            TG канал
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
