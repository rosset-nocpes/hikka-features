import { useEffect, useState } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import MaterialSymbolsExpandAllRounded from '~icons/material-symbols/expand-all-rounded';
import SwitchOption from '../_base/switch-option';

const PlayerSettings = () => {
  const [showWatchButton, toggleWatchButton] = useState<boolean | null>(null);

  const [defaultPlayerProvider, setDefaultPlayerProvider] =
    useState<PlayerSource | null>(null);

  useEffect(() => {
    Promise.all([watchButtonState.getValue(), defaultPlayer.getValue()]).then(
      ([watchButton, defaultPlayerValue]) => {
        toggleWatchButton(watchButton);
        setDefaultPlayerProvider(defaultPlayerValue);
      },
    );
  }, []);

  return (
    <Drawer>
      <div className="flex justify-between">
        <div className="mr-10 flex flex-col gap-1">
          <label className="font-medium text-sm">Програвач</label>
          <div className="font-medium text-[#A1A1A1] text-xs">
            Налаштування програвача
          </div>
        </div>
        <DrawerTrigger asChild>
          <Button size="icon-sm">
            <MaterialSymbolsExpandAllRounded />
          </Button>
        </DrawerTrigger>
      </div>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Налаштування програвача</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-5 px-[30px]">
            <SwitchOption
              checked={showWatchButton!}
              label="Кнопка перегляду"
              description="Кнопка для відображення програвача"
              onClick={() => {
                watchButtonState.setValue(!showWatchButton);
                toggleWatchButton(!showWatchButton);
              }}
            />
            <div className="flex items-center justify-between">
              <label className="font-medium text-sm">
                Програвач за замовчуванням
              </label>
              {navigator.userAgent.toLowerCase().includes('firefox') ? (
                <select
                  className="flex h-10 w-24 cursor-pointer items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
                  value={defaultPlayerProvider!}
                  onChange={(e) => {
                    defaultPlayer.setValue(e.target.value as PlayerSource);
                    setDefaultPlayerProvider(e.target.value as PlayerSource);
                  }}
                >
                  {['moon', 'ashdi'].map((elem) => (
                    <option key={elem} value={elem}>
                      {elem.toUpperCase()}
                    </option>
                  ))}
                </select>
              ) : (
                <Select
                  value={defaultPlayerProvider!}
                  onValueChange={(value) => {
                    defaultPlayer.setValue(value as PlayerSource);
                    setDefaultPlayerProvider(value as PlayerSource);
                  }}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Оберіть програвач за замовчуванням" />
                  </SelectTrigger>
                  <SelectContent>
                    {['moon', 'ashdi'].map((elem) => (
                      <SelectItem key={elem} value={elem}>
                        {elem.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
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
  );
};

export default PlayerSettings;
