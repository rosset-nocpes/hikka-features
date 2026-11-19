import { useEffect, useState } from 'react';
import MaterialSymbolsUpgradeRounded from '~icons/material-symbols/upgrade-rounded';

import {
  type ExtensionCompatibilityState,
  watchCompatibility,
} from '@/utils/compatibility';

import RowDescription from './row-description';

/**
 * Says why features stopped when the backend no longer serves this build.
 * The browser installs the update on its own, so there is nothing to click.
 */
const UpdateBanner = () => {
  const [compatibility, setCompatibility] =
    useState<ExtensionCompatibilityState>();
  useEffect(() => watchCompatibility(setCompatibility), []);
  if (compatibility?.status !== 'unsupported') return null;

  return (
    <div
      role="alert"
      className="border-destructive/40 bg-destructive/10 flex items-center gap-3 rounded-lg border px-4 py-3"
    >
      <MaterialSymbolsUpgradeRounded className="text-destructive size-5 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm">Очікує оновлення</span>
        <RowDescription>
          Сервер більше не підтримує цю версію, тому програвач, акаунт і
          сповіщення не працюють. Браузер оновить розширення автоматично.
        </RowDescription>
      </div>
    </div>
  );
};

export default UpdateBanner;
