import { useEffect, useState } from 'react';
import MaterialSymbolsCodeRounded from '~icons/material-symbols/code-rounded';
import MaterialSymbolsPetsRounded from '~icons/material-symbols/pets-rounded';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useCopy } from '@/hooks/use-copy';
import { version } from '@/package.json';
import {
  type ExtensionCompatibilityState,
  watchCompatibility,
} from '@/utils/compatibility';
import { convex } from '@/utils/convex-client';

import ActionRow from '../_base/action-row';
import ConfirmButton from '../_base/confirm-button';
import FeatureSwitch from '../_base/feature-switch';
import { resetSettings } from '../_base/reset-settings';
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

/** Values a dump leaves out: the session's token and a login's verifier. */
const SECRET_KEYS = new Set(['refreshToken', 'verifier']);

/** Everything in `storage.local`, with stores parsed and secrets hidden. */
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
    (key, value) => (SECRET_KEYS.has(key) ? '[hidden]' : value),
    2,
  );
};

/** A long value on one line, cut short. */
const Value = ({ children }: { children: string }) => (
  <RowDescription>
    <span className="block truncate" title={children}>
      {children}
    </span>
  </RowDescription>
);

/** What a developer checks and resets, shown in developer mode. */
const DevToolsGroup = () => {
  const { devTools } = useSettings().features.devOptions;
  const { copied, copy } = useCopy(1000);
  const [compatibility, setCompatibility] =
    useState<ExtensionCompatibilityState>();
  const [checking, setChecking] = useState(false);
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
      <ActionRow label="Збірка" description={<Value>{BUILD}</Value>}>
        {copyButton('build', () => BUILD)}
      </ActionRow>
      <ActionRow
        label="Сервер"
        description={
          <Value>{import.meta.env.WXT_CONVEX_URL || 'Не налаштований'}</Value>
        }
      >
        {copyButton('server', () => import.meta.env.WXT_CONVEX_URL ?? '')}
      </ActionRow>
      <ActionRow
        label="Сумісність"
        description={
          <Value>
            {compatibility
              ? `${COMPATIBILITY_LABELS[compatibility.status]} · ${compatibility.latestVersion} (мін. ${compatibility.minimumVersion})`
              : 'Ще не перевірялась'}
          </Value>
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
        label="Усі налаштування"
        description="Усе, крім режиму розробника, разом з улюбленими командами"
      >
        <ConfirmButton
          label="Скинути всі налаштування"
          onConfirm={resetSettings}
        >
          Скинути
        </ConfirmButton>
      </ActionRow>
    </SettingsGroup>
  );
};

export default ExperimentalSettingsPage;
