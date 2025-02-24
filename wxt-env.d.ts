/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly WXT_BACKEND_BASE_URL: string;
  readonly WXT_BACKEND_WS_ENDPOINT: string;
  readonly WXT_PERSIST_BROWSER_DATA: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
