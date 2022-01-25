/// <reference types="vite/client" />

declare module "*.vue" {
  import { DefineComponent } from "vue";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

interface Window {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  electron: { apis: any; getImg: (path: string) => Promise<string> };
}

declare const __APP_VERSION__: string;
