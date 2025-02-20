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

const LocalizedPosterSettings = () => {
  const [showLocalizedPosterButton, toggleLocalizedPosterButton] = useState<
    boolean | null
  >(null);
  const [showLocalizedPoster, toggleLocalizedPoster] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    Promise.all([
      localizedPosterButtonState.getValue(),
      localizedPosterState.getValue(),
    ]).then(([localizedPosterButton, localizedPoster]) => {
      toggleLocalizedPosterButton(localizedPosterButton);
      toggleLocalizedPoster(localizedPoster);
    });
  }, []);

  return (
    <Drawer>
      <div className="flex justify-between">
        <div className="mr-10 flex flex-col gap-1">
          <label className="font-medium text-sm">Локалізовані постери</label>
          <div className="font-medium text-[#A1A1A1] text-xs">
            Налаштування локалізованих постерів
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
            <DrawerTitle>Локалізовані постери</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-5 px-[30px]">
            <SwitchOption
              checked={showLocalizedPosterButton!}
              label="Кнопка локалізації постера"
              onClick={() => {
                localizedPosterButtonState.setValue(!showLocalizedPosterButton);
                toggleLocalizedPosterButton(!showLocalizedPosterButton);
              }}
            />
            <SwitchOption
              checked={showLocalizedPoster!}
              label="Автолокалізація постера"
              description="Автоматично замінює постер локалізованою версією"
              onClick={() => {
                localizedPosterState.setValue(!showLocalizedPoster);
                toggleLocalizedPoster(!showLocalizedPoster);
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

export default LocalizedPosterSettings;
