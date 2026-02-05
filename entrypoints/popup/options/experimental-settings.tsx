import { AnimatePresence, motion } from 'motion/react';
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
              <div className="flex flex-col gap-5 px-[30px]">
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
                  <label className="font-medium text-sm">Гілка бекенду</label>
                  {navigator.userAgent.toLowerCase().includes('firefox') ? (
                    <select
                      className="flex h-10 w-24 cursor-pointer items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
                      value={backendBranch}
                      onChange={(e) => {
                        const value = e.target.value as BackendBranches;
                        setSettings({ backendBranch: value });
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
                      value={backendBranch}
                      onValueChange={(value) => {
                        const target = value as BackendBranches;
                        setSettings({ backendBranch: target });
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
