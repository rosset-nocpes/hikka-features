export const EXTENSION_API_PROTOCOL = 1;
export const COMPATIBILITY_STORAGE_KEY = 'extensionCompatibility';
export const RELOAD_TABS_STORAGE_KEY = 'reloadHikkaTabsAfterUpdate';

export type CompatibilityStatus =
  | 'current'
  | 'update_available'
  | 'unsupported';

export type StoreUpdateStatus = 'throttled' | 'no_update' | 'update_available';

export interface CompatibilityResponse {
  status: CompatibilityStatus;
  latestVersion: string;
  minimumVersion: string;
  protocolSupported: boolean;
}

export interface ExtensionCompatibilityState extends CompatibilityResponse {
  extensionVersion: string;
  updateReady: boolean;
  checkedAt: number;
  updateCheckedAt?: number;
  storeStatus?: StoreUpdateStatus;
}

export interface CompatibilityMessage {
  type: 'extension-compatibility';
  state: ExtensionCompatibilityState;
}
