import { useEffect, useState } from 'react';
import MaterialSymbolsUpgradeRounded from '~icons/material-symbols/upgrade-rounded';

import {
  COMPATIBILITY_STORAGE_KEY,
  type ExtensionCompatibilityState,
} from '@/utils/compatibility';

/** The stored compatibility check, while it is about this build. */
function useCompatibility() {
  const [state, setState] = useState<ExtensionCompatibilityState>();

  useEffect(() => {
    const version = browser.runtime.getManifest().version;
    const show = (value: unknown) => {
      const next = value as ExtensionCompatibilityState | undefined;
      setState(next?.extensionVersion === version ? next : undefined);
    };
    void browser.storage.local
      .get(COMPATIBILITY_STORAGE_KEY)
      .then((stored) => show(stored[COMPATIBILITY_STORAGE_KEY]));
    const onChanged = (
      changes: Record<string, Browser.storage.StorageChange>,
      area: string,
    ) => {
      if (area === 'local' && COMPATIBILITY_STORAGE_KEY in changes) {
        show(changes[COMPATIBILITY_STORAGE_KEY]!.newValue);
      }
    };
    browser.storage.onChanged.addListener(onChanged);
    return () => browser.storage.onChanged.removeListener(onChanged);
  }, []);

  return state;
}

/**
 * Says why features stopped when the backend no longer serves this build.
 * The browser installs the update on its own, so there is nothing to click.
 */
const UpdateBanner = () => {
  const compatibility = useCompatibility();
  if (compatibility?.status !== 'unsupported') return null;

  return (
    <div
      role="alert"
      className="border-destructive/40 bg-destructive/10 flex items-center gap-3 rounded-lg border px-4 py-3"
    >
      <MaterialSymbolsUpgradeRounded className="text-destructive size-5 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm">Очікує оновлення</span>
        <span className="text-xs font-medium text-pretty text-[#A1A1A1]">
          Сервер більше не підтримує цю версію, тому програвач, акаунт і
          сповіщення не працюють. Браузер оновить розширення автоматично.
        </span>
      </div>
    </div>
  );
};

export default UpdateBanner;
