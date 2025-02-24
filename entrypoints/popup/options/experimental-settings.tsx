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
import { AnimatePresence, motion } from 'motion/react';
import { FC } from 'react';
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

  useEffect(() => {
    backendBranch.getValue().then((branch) => {
      setBackendBranch(branch);
    });
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
                <div className="flex items-center justify-between">
                  <label className="font-medium text-sm">Гілка бекенду</label>
                  <Select
                    value={getBackendBranch!}
                    onValueChange={(value) => {
                      const target = value as BackendBranches;
                      backendBranch.setValue(target);
                      setBackendBranch(target);
                    }}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Оберіть гілку бекенду" />
                    </SelectTrigger>
                    <SelectContent>
                      {['stable', 'beta', 'localhost'].map((elem) => (
                        <SelectItem key={elem} value={elem}>
                          {elem}
                        </SelectItem>
                      ))}
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
      )}
    </AnimatePresence>
  );
};

export default ExperimentalSettings;
