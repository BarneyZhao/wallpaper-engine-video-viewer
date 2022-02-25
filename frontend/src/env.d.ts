/// <reference types="vite/client" />

declare module "*.vue" {
  import { DefineComponent } from "vue";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}
interface Window {
  electron: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apis: Record<string, (...arg: any[]) => Promise<ApiResponse>>;
    getImg: (path: string) => Promise<string>;
  };
}

declare const __APP_VERSION__: string;
