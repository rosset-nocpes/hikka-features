import { defineConfig } from "wxt";
import Solid from "vite-plugin-solid";
import Icons from "unplugin-icons/vite";

export default defineConfig({
  vite: () => ({
    build: {
      target: "esnext",
    },
    plugins: [Solid(), Icons({ compiler: "solid" })],
    modules: ["@wxt-dev/module-solid"],
  }),
  manifest: () => ({
    name: "Hikka Features",
    permissions: ["webNavigation", "storage"],
    host_permissions: [
      "https://*.hikka.io/*",
      "https://*.hikka-features.pp.ua/*",
      "https://corsproxy.io/*",
      "https://graphql.anilist.co/*",
    ],
    browser_specific_settings: {
      gecko: {
        id: "extension@hikka-features.pp.ua",
      },
    },
  }),
});
