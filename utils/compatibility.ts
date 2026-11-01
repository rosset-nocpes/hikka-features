import { StoredValue } from './stored-value';

export const EXTENSION_API_PROTOCOL = 1;

export interface CompatibilityResponse {
  status: 'current' | 'update_available' | 'unsupported';
  latestVersion: string;
  minimumVersion: string;
  protocolSupported: boolean;
}

export interface ExtensionCompatibilityState extends CompatibilityResponse {
  extensionVersion: string;
  checkedAt: number;
}

/** The backend's last answer on whether it serves this install's build. */
export const compatibilityState = new StoredValue<ExtensionCompatibilityState>(
  'extensionCompatibility',
);

/** The UTC day and version this install last counted itself on. */
export const usageReport = new StoredValue<string>('extensionUsageReport');

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
