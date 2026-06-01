import { AnimatePresence, motion } from 'motion/react';
import MaterialSymbolsExperiment from '~icons/material-symbols/experiment';

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

const ExperimentalSettings = () => {
  const { backendBranch, features, updateFeatureSettings, setSettings } =
    useSettings();
  const { enabled, burunyaaMode, devTools } = features.devOptions;

  return (
    <AnimatePresence>
      {enabled && (
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
              <div className="flex flex-col gap-5 px-7.5">
                <SwitchOption
                  label="Burunyaa режим"
                  checked={burunyaaMode}
                  onClick={() => {
                    updateFeatureSettings('devOptions', {
                      burunyaaMode: !burunyaaMode,
                    });
                  }}
                />
                <SwitchOption
                  label="Режим розробника"
                  description="Додає функції, які полегшують роботу з розширенням"
                  checked={devTools}
                  onClick={() => {
                    updateFeatureSettings('devOptions', {
                      devTools: !devTools,
                    });
                  }}
                />
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Гілка бекенду</label>
                  <Select
                    value={backendBranch}
                    onValueChange={(value) => {
                      if (!value) return;
                      const target = value as BackendBranches;
                      setSettings({ backendBranch: target });
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Оберіть гілку бекенду" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {Object.keys(BACKEND_BRANCHES).map((elem) => (
                          <SelectItem key={elem} value={elem}>
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
      )}
    </AnimatePresence>
  );
};

export default ExperimentalSettings;
