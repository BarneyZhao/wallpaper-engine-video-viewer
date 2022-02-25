import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import { Resolver } from "unplugin-auto-import/dist/types";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

import pkg from "./package.json";

// https://vitejs.dev/config/
export default defineConfig({
  base: "",
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver() as Resolver[]],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
});
