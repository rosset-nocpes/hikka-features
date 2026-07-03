import MaterialSymbolsExpandAllRounded from '~icons/material-symbols/expand-all-rounded';

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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import SwitchOption from '../_base/switch-option';

const PlayerSettings = () => {
  const { features, updateFeatureSettings } = useSettings();
  const { enabled, defaultProvider, disableBlur, miniModeType } =
    features.player;

  return (
    <Drawer>
      <div className="flex justify-between">
        <div className="mr-10 flex flex-col gap-1">
          <label className="text-sm font-medium">Програвач</label>
          <div className="text-xs font-medium text-[#A1A1A1]">
            Налаштування програвача
          </div>
        </div>
        <DrawerTrigger
          render={
            <Button size="icon-sm">
              <MaterialSymbolsExpandAllRounded />
            </Button>
          }
        />
      </div>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Налаштування програвача</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-5 px-7.5">
            <SwitchOption
              checked={enabled}
              label="Кнопка перегляду"
              description="Кнопка для відображення програвача"
              onClick={() => {
                updateFeatureSettings('player', { enabled: !enabled });
              }}
            />
            <SwitchOption
              checked={disableBlur}
              label="Вимкнути блюр"
              description="Прибирає розмиття фону в програвачі"
              onClick={() => {
                updateFeatureSettings('player', {
                  disableBlur: !disableBlur,
                });
              }}
            />
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Тип мінірежиму</label>
              {navigator.userAgent.toLowerCase().includes('firefox') ? (
                <select
                  className="flex h-10 w-36 cursor-pointer items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
                  value={miniModeType}
                  onChange={(e) => {
                    updateFeatureSettings('player', {
                      miniModeType: e.target.value as 'custom' | 'video-native',
                    });
                  }}
                >
                  <option value="custom">Кастомний</option>
                  <option value="video-native">Картинка в картинці</option>
                </select>
              ) : (
                <Select
                  value={miniModeType}
                  onValueChange={(value) => {
                    updateFeatureSettings('player', {
                      miniModeType: value as 'custom' | 'video-native',
                    });
                  }}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Оберіть тип мінірежиму" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Кастомний</SelectItem>
                    <SelectItem value="video-native">
                      Картинка в картинці
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Програвач за замовчуванням
              </label>
              <Select
                value={defaultProvider}
                onValueChange={(value) => {
                  if (!value) return;
                  updateFeatureSettings('player', { defaultProvider: value });
                }}
              >
                <SelectTrigger className="w-24">
                  <SelectValue
                    className="uppercase"
                    placeholder="Оберіть програвач за замовчуванням"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {['moon', 'ashdi'].map((elem) => (
                      <SelectItem className="uppercase" key={elem} value={elem}>
                        {elem}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
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
