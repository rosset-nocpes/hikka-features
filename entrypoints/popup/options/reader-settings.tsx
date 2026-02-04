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
import MaterialSymbolsExpandAllRounded from '~icons/material-symbols/expand-all-rounded';
import SwitchOption from '../_base/switch-option';

const ReaderSettings = () => {
  const { features, updateFeatureSettings } = useSettings();
  const { enabled } = features.reader;

  return (
    <Drawer>
      <div className="flex justify-between">
        <div className="mr-10 flex flex-col gap-1">
          <label className="font-medium text-sm">Читалка</label>
          <div className="font-medium text-[#A1A1A1] text-xs">
            Налаштування читалки
          </div>
        </div>
        <DrawerTrigger>
          <Button size="icon-sm">
            <MaterialSymbolsExpandAllRounded />
          </Button>
        </DrawerTrigger>
      </div>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Налаштування читалки</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-5 px-[30px]">
            <SwitchOption
              checked={enabled}
              label="Кнопка читалки"
              description="Кнопка для відображення читалки"
              onClick={() => {
                updateFeatureSettings('reader', { enabled: !enabled });
              }}
            />
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

export default ReaderSettings;
