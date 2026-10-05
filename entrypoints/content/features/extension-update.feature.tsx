import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import MaterialSymbolsSystemUpdateAltRounded from '~icons/material-symbols/system-update-alt-rounded';

import { Button } from '@/components/ui/button';
import {
  type CompatibilityMessage,
  type ExtensionCompatibilityState,
} from '@/utils/compatibility';
import { syncFeatureTheme } from '@/utils/utils';

import { BaseFeature } from '../core/base-feature';
import { HikkaPages } from '../core/core.enums';

export default class ExtensionUpdateFeature extends BaseFeature {
  readonly id = 'extension-update-banner';
  readonly pages = [HikkaPages.All];

  async init() {
    this.ui = await createShadowRootUi(usePageStore.getState().ctx, {
      name: this.id,
      position: 'inline',
      anchor: 'body',
      append: 'first',
      inheritStyles: true,
      onMount(container) {
        const wrapper = document.createElement('div');
        container.append(wrapper);
        syncFeatureTheme(container, { themeVariables: true });

        const root = createRoot(wrapper);
        root.render(<ExtensionUpdateBanner />);
        return root;
      },
      onRemove: (root) => root?.unmount(),
    });
    this.mount();
  }
}

const ExtensionUpdateBanner = () => {
  const [state, setState] = useState<ExtensionCompatibilityState>();
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    browser.runtime
      .sendMessage({ type: 'extension-compatibility-status' })
      .then((response) =>
        setState(response as ExtensionCompatibilityState | undefined),
      )
      .catch(() => undefined);

    const onMessage = (message: unknown) => {
      if (
        !message ||
        typeof message !== 'object' ||
        !('type' in message) ||
        message.type !== 'extension-compatibility' ||
        !('state' in message)
      ) {
        return;
      }
      setState((message as CompatibilityMessage).state);
      setRequesting(false);
    };
    browser.runtime.onMessage.addListener(onMessage);
    return () => browser.runtime.onMessage.removeListener(onMessage);
  }, []);

  const update = async () => {
    setRequesting(true);
    try {
      const response = (await browser.runtime.sendMessage({
        type: 'extension-update',
      })) as ExtensionCompatibilityState | undefined;
      if (response) setState(response);
    } finally {
      setRequesting(false);
    }
  };

  const waitingForDownload =
    state?.storeStatus === 'update_available' && !state.updateReady;

  return (
    <AnimatePresence>
      {state && state.status !== 'current' && (
        <motion.div
          className="pointer-events-none fixed inset-x-0 top-4 z-[2147483647] flex justify-center px-4"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <div className="border-border bg-popover text-popover-foreground pointer-events-auto grid w-full max-w-2xl grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl border p-3 shadow-xl shadow-black/10 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
            <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
              <MaterialSymbolsSystemUpdateAltRounded className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">
                {state.status === 'unsupported'
                  ? 'Потрібне оновлення Hikka Features'
                  : 'Доступне оновлення Hikka Features'}
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {state.storeStatus === 'no_update'
                  ? 'Оновлення ще недоступне в магазині браузера. Спробуйте трохи пізніше.'
                  : state.updateReady
                    ? `Версія ${state.latestVersion} готова. Оновіть розширення та перезавантажте Hikka.`
                    : `Встановлена версія ${state.extensionVersion}; актуальна — ${state.latestVersion}.`}
              </p>
            </div>
            <Button
              size="md"
              className="col-span-2 w-full sm:col-span-1 sm:w-auto"
              disabled={requesting || waitingForDownload}
              onClick={update}
            >
              {requesting
                ? 'Перевіряємо…'
                : waitingForDownload
                  ? 'Завантажуємо…'
                  : state.updateReady
                    ? 'Оновити'
                    : 'Перевірити'}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
