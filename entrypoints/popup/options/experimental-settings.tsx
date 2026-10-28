import { AnimatePresence, motion } from 'motion/react';
import MaterialSymbolsExperiment from '~icons/material-symbols/experiment';

import { useNavigation } from '@/hooks/use-navigation';

import FeatureSwitch from '../_base/feature-switch';
import SettingsGroup from '../_base/settings-group';
import SettingsPage from '../_base/settings-page';

const ExperimentalSettingsPage = () => (
  <SettingsPage>
    <SettingsGroup>
      <FeatureSwitch
        feature="devOptions"
        option="burunyaaMode"
        label="Burunyaa режим"
      />
      <FeatureSwitch
        feature="devOptions"
        option="devTools"
        label="Режим розробника"
        description="Додає функції, які полегшують роботу з розширенням"
      />
    </SettingsGroup>
  </SettingsPage>
);

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
