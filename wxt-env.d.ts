/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly WXT_PERSIST_BROWSER_DATA: boolean;
  readonly WXT_CONVEX_URL?: string;
  readonly WXT_CONVEX_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
