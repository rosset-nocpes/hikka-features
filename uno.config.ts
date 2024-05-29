import { defineConfig, presetUno } from "unocss";
import { presetIcons } from "unocss";

export default defineConfig({
  presets: [presetUno(), presetIcons({})],
});
