import type { FunctionReturnType } from 'convex/server';

import { STORAGE_KEYS } from '@/constants/storage';

import type { convexApi } from './convex-api';

import { StoredValue } from './stored-value';

export const EXTENSION_API_PROTOCOL = 1;

/** Whether the backend still serves this build, as it answers. */
export type CompatibilityResponse = FunctionReturnType<
  typeof convexApi.compatibility.get
>;

export interface ExtensionCompatibilityState extends CompatibilityResponse {
  extensionVersion: string;
  checkedAt: number;
}

/** The backend's last answer on whether it serves this install's build. */
export const compatibilityState = new StoredValue<ExtensionCompatibilityState>(
  STORAGE_KEYS.compatibility,
);

/** The stored answer, while it is about this build. */
const forThisBuild = (state: ExtensionCompatibilityState | undefined) =>
  state?.extensionVersion === browser.runtime.getManifest().version
    ? state
    : undefined;

export const currentCompatibility = async () =>
  forThisBuild(await compatibilityState.get());

/**
 * Calls `listener` with the answer about this build, now and whenever it
 * changes; returns what stops it.
 */
export function watchCompatibility(
  listener: (state: ExtensionCompatibilityState | undefined) => void,
) {
  void currentCompatibility().then(listener);
  return compatibilityState.watch((state) => listener(forThisBuild(state)));
}
