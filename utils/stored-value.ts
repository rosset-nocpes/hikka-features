/**
 * A value in `storage.local` under `key`, which every context of the
 * extension reads, writes and follows.
 */
export class StoredValue<T> {
  constructor(readonly key: string) {}

  async get() {
    const stored = await browser.storage.local.get(this.key);
    return stored[this.key] as T | undefined;
  }

  set(value: T) {
    return browser.storage.local.set({ [this.key]: value });
  }

  remove() {
    return browser.storage.local.remove(this.key);
  }

  /** Calls `listener` with every value stored from now on; returns what stops it. */
  watch(listener: (value: T | undefined) => void) {
    const onChanged = (
      changes: Record<string, Browser.storage.StorageChange>,
      area: string,
    ) => {
      if (area === 'local' && this.key in changes) {
        listener(changes[this.key]!.newValue as T | undefined);
      }
    };
    browser.storage.onChanged.addListener(onChanged);
    return () => browser.storage.onChanged.removeListener(onChanged);
  }
}
