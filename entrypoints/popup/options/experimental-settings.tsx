import { AnimatePresence, motion } from 'motion/react';
import { type ReactNode, useEffect, useState } from 'react';
import MaterialSymbolsCodeRounded from '~icons/material-symbols/code-rounded';
import MaterialSymbolsExperiment from '~icons/material-symbols/experiment';
import MaterialSymbolsPetsRounded from '~icons/material-symbols/pets-rounded';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useCopy } from '@/hooks/use-copy';
import { useNavigation } from '@/hooks/use-navigation';
import { version } from '@/package.json';
import {
  type ExtensionCompatibilityState,
  watchCompatibility,
} from '@/utils/compatibility';
import { convex } from '@/utils/convex-client';

import FeatureSwitch from '../_base/feature-switch';
import RowDescription from '../_base/row-description';
import SettingsGroup from '../_base/settings-group';
import SettingsPage from '../_base/settings-page';

const ExperimentalSettingsPage = () => (
  <SettingsPage>
    <SettingsGroup footer="Щоб сховати цю сторінку, ще раз натисніть п’ять разів на версію.">
      <FeatureSwitch
        feature="devOptions"
        option="burunyaaMode"
        icon={<MaterialSymbolsPetsRounded />}
        label="Burunyaa режим"
      />
      <FeatureSwitch
        feature="devOptions"
        option="devTools"
        icon={<MaterialSymbolsCodeRounded />}
        label="Режим розробника"
        description="Додає функції, які полегшують роботу з розширенням"
      />
    </SettingsGroup>
    <DevToolsGroup />
  </SettingsPage>
);

const COMPATIBILITY_LABELS: Record<
  ExtensionCompatibilityState['status'],
  string
> = {
  current: 'Актуальна',
  update_available: 'Є оновлення',
  unsupported: 'Не підтримується',
};

const BUILD = `v${version} · ${import.meta.env.MODE} · ${import.meta.env.BROWSER}`;

/** Everything in `storage.local`, with stores parsed and the session hidden. */
const dumpStorage = async () => {
  const stored: Record<string, unknown> = await browser.storage.local.get();
  const entries = Object.entries(stored).map(([key, value]) => {
    if (typeof value !== 'string') return [key, value];
    try {
      return [key, JSON.parse(value)];
    } catch {
      return [key, value];
    }
  });
  return JSON.stringify(
    Object.fromEntries(entries),
    (key, value) => (key === 'refreshToken' ? '[hidden]' : value),
    2,
  );
};

/**
 * Resets every feature's settings, except these developer options. The team
 * priority syncs as if for the first time, which keeps the account's order
 * rather than pushing the empty default over it.
 */
const resetSettings = () => {
  const { features } = useSettings.getState();
  useSettings.setState({
    teamPrioritySyncedAt: 0,
    features: {
      ...useSettings.getInitialState().features,
      devOptions: features.devOptions,
    },
  });
};

interface ActionRowProps {
  label: string;
  description?: ReactNode;
  children: ReactNode;
}

const ActionRow = ({ label, description, children }: ActionRowProps) => (
  <div className="flex items-center justify-between gap-3 px-4 py-3">
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-sm leading-none font-medium">{label}</span>
      {description && (
        <RowDescription>
          <span className="block truncate">{description}</span>
        </RowDescription>
      )}
    </div>
    {children}
  </div>
);

/** What a developer checks and resets, shown in developer mode. */
const DevToolsGroup = () => {
  const { devTools } = useSettings().features.devOptions;
  const { copied, copy } = useCopy(1000);
  const [compatibility, setCompatibility] =
    useState<ExtensionCompatibilityState>();
  const [checking, setChecking] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  useEffect(() => watchCompatibility(setCompatibility), []);

  if (!devTools) return null;

  const copyButton = (key: string, text: () => string | Promise<string>) => (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground min-w-24 shrink-0"
      onClick={async () => copy(await text(), key)}
    >
      {copied === key ? 'Скопійовано' : 'Копіювати'}
    </Button>
  );

  const checkCompatibility = async () => {
    setChecking(true);
    try {
      await convex.refreshCompatibility();
    } catch (error) {
      console.error(error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <SettingsGroup title="Розробка">
      <ActionRow label="Збірка" description={BUILD}>
        {copyButton('build', () => BUILD)}
      </ActionRow>
      <ActionRow
        label="Сервер"
        description={import.meta.env.WXT_CONVEX_URL || 'Не налаштований'}
      >
        {copyButton('server', () => import.meta.env.WXT_CONVEX_URL ?? '')}
      </ActionRow>
      <ActionRow
        label="Сумісність"
        description={
          compatibility
            ? `${COMPATIBILITY_LABELS[compatibility.status]} · ${compatibility.latestVersion} (мін. ${compatibility.minimumVersion})`
            : 'Ще не перевірялась'
        }
      >
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground min-w-24 shrink-0"
          disabled={checking}
          onClick={checkCompatibility}
        >
          {checking ? <Spinner /> : 'Перевірити'}
        </Button>
      </ActionRow>
      <ActionRow label="Сховище" description="JSON без токена сесії">
        {copyButton('storage', dumpStorage)}
      </ActionRow>
      <ActionRow
        label="Налаштування"
        description="Типові значення всіх функцій"
      >
        <Button
          variant={confirmReset ? 'destructive' : 'ghost'}
          size="sm"
          className={cn(
            'min-w-24 shrink-0',
            !confirmReset && 'text-muted-foreground',
          )}
          onBlur={() => setConfirmReset(false)}
          onClick={() => {
            if (!confirmReset) return setConfirmReset(true);
            setConfirmReset(false);
            resetSettings();
          }}
        >
          {confirmReset ? 'Точно?' : 'Скинути'}
        </Button>
      </ActionRow>
    </SettingsGroup>
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
