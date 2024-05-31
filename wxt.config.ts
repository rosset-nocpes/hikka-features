import { defineConfig } from "wxt";
import Solid from "vite-plugin-solid";
import path from "path";

export default defineConfig({
  vite: () => ({
    build: {
      target: "esnext",
    },
    plugins: [Solid()],
    resolve: {
      alias: {
        "~": path.resolve(__dirname, "./"),
      },
    },
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
