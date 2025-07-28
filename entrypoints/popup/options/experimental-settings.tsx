import { AnimatePresence, motion } from 'motion/react';
import type { FC } from 'react';
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
import MaterialSymbolsExperiment from '~icons/material-symbols/experiment';
import SwitchOption from '../_base/switch-option';

interface Props {
  showDevOptions: boolean;
  getBurunyaaMode: boolean | null;
  toggleBurunyaaMode: (value: boolean) => void;
}

const ExperimentalSettings: FC<Props> = ({
  showDevOptions,
  getBurunyaaMode,
  toggleBurunyaaMode,
}) => {
  const [getBackendBranch, setBackendBranch] = useState<BackendBranches | null>(
    null,
  );

  const [getDevMode, toggleDevMode] = useState<boolean | null>(null);

  useEffect(() => {
    Promise.all([backendBranch.getValue(), devMode.getValue()]).then(
      ([backendBranch, devMode]) => {
        setBackendBranch(backendBranch);
        toggleDevMode(devMode);
      },
    );
  }, []);

  return (
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
          <DrawerContent>
            <div className="mx-auto w-full max-w-sm">
              <DrawerHeader>
                <DrawerTitle>Експерементальні функції</DrawerTitle>
              </DrawerHeader>
              <div className="flex flex-col gap-5 px-[30px]">
                <SwitchOption
                  label="Burunyaa режим"
                  checked={getBurunyaaMode!}
                  onClick={() => {
                    burunyaaMode.setValue(!getBurunyaaMode);
                    toggleBurunyaaMode(!getBurunyaaMode);
                  }}
                />
                <SwitchOption
                  label="Режим розробника"
                  description="Додає функції, які полегшують роботу з розширенням"
                  checked={getDevMode!}
                  onClick={() => {
                    devMode.setValue(!getDevMode);
                    toggleDevMode(!getDevMode);
                  }}
                />
                <div className="flex items-center justify-between">
                  <label className="font-medium text-sm">Гілка бекенду</label>
                  {navigator.userAgent.toLowerCase().includes('firefox') ? (
                    <select
                      className="flex h-10 w-24 cursor-pointer items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
                      value={getBackendBranch!}
                      onChange={(e) => {
                        const value = e.target.value as BackendBranches;
                        backendBranch.setValue(value);
                        setBackendBranch(value);
                      }}
                    >
                      {Object.keys(BACKEND_BRANCHES).map((elem) => (
                        <option key={elem} value={elem}>
                          {elem}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Select
                      value={getBackendBranch!}
                      onValueChange={(value) => {
                        const target = value as BackendBranches;
                        backendBranch.setValue(target);
                        setBackendBranch(target);
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Оберіть гілку бекенду" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(BACKEND_BRANCHES).map((elem) => (
                          <SelectItem key={elem} value={elem}>
                            {elem}
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
      )}
    </AnimatePresence>
  );
};

export default ExperimentalSettings;
