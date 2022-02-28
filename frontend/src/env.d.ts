/// <reference types="vite/client" />

declare module "*.vue" {
  import { DefineComponent } from "vue";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PromiseFunc = (...arg: any[]) => Promise<any>;
interface Window {
  electron: {
    apis: Record<string, PromiseFunc>;
    getImg: (path: string) => Promise<string>;
  };
}

declare const __APP_VERSION__: string;
