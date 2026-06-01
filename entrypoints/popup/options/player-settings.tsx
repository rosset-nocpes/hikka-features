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
  const { enabled, defaultProvider, disableBlur } = features.player;

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
