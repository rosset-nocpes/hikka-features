import { AnimatePresence, motion } from 'motion/react';
import MaterialSymbolsExperiment from '~icons/material-symbols/experiment';

import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNavigation } from '@/hooks/use-navigation';

import SettingsGroup from '../_base/settings-group';
import SwitchOption from '../_base/switch-option';

const ExperimentalSettingsPage = () => {
  const { backendBranch, features, updateFeatureSettings, setSettings } =
    useSettings();
  const { burunyaaMode, devTools } = features.devOptions;

  return (
    <ScrollArea className="flex-1" scrollFade>
      <div className="flex flex-col gap-3 pb-4">
        <SettingsGroup>
          <SwitchOption
            grouped
            label="Burunyaa режим"
            checked={burunyaaMode}
            onClick={() => {
              updateFeatureSettings('devOptions', {
                burunyaaMode: !burunyaaMode,
              });
            }}
          />
          <SwitchOption
            grouped
            label="Режим розробника"
            description="Додає функції, які полегшують роботу з розширенням"
            checked={devTools}
            onClick={() => {
              updateFeatureSettings('devOptions', {
                devTools: !devTools,
              });
            }}
          />
          <div className="flex items-center justify-between px-4 py-3">
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
        </SettingsGroup>
      </div>
    </ScrollArea>
  );
};

export function ExperimentalSettingsIcon() {
  const { enabled } = useSettings().features.devOptions;
  const { navigate } = useNavigation();

  return (
    <AnimatePresence initial={false}>
      {enabled && (
        <motion.button
          type="button"
          onClick={() => navigate('experimental')}
          initial={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.25, filter: 'blur(4px)' }}
          transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
        >
          <MaterialSymbolsExperiment />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default ExperimentalSettingsPage;
