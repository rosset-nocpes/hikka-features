/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly WXT_PERSIST_BROWSER_DATA: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
