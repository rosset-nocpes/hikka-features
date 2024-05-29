import { defineConfig } from "wxt";
import Solid from "vite-plugin-solid";
import UnoCSS from "unocss/vite";

export default defineConfig({
  vite: () => ({
    build: {
      target: "esnext",
    },
    plugins: [UnoCSS(), Solid()],
  }),
  manifest: () => ({
    permissions: ["webNavigation", "tabs", "storage", "activeTab"],
    host_permissions: [
      "https://*.hikka.io/*",
      "https://hikka-features.pp.ua/*",
      "https://corsproxy.io/*",
      "https://graphql.anilist.co/*",
    ],
  }),
});
