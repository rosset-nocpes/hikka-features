export const EXTENSION_API_PROTOCOL = 1;
export const COMPATIBILITY_STORAGE_KEY = 'extensionCompatibility';

export type CompatibilityStatus =
  | 'current'
  | 'update_available'
  | 'unsupported';

export interface CompatibilityResponse {
  status: CompatibilityStatus;
  latestVersion: string;
  minimumVersion: string;
  protocolSupported: boolean;
}

export interface ExtensionCompatibilityState extends CompatibilityResponse {
  extensionVersion: string;
  checkedAt: number;
}
