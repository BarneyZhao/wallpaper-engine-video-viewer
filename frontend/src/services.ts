import { gt } from "semver";
import { ElMessage, ElNotification } from "element-plus";
import "element-plus/es/components/message/style/css";
import "element-plus/es/components/notification/style/css";

import APIS, { Services, ProjectTableRow } from "../../api-config";

import { specifyElectronVersion } from "./const";

export enum CopyStuts {
  NORMAL,
  RUNING,
  COPIED,
}

export type Project = ProjectTableRow & { copyStuts?: CopyStuts };

// 提取 promise 中的类型
type Unpromise<T> = T extends Promise<infer U> ? U : T;
/**
 * 转换 services 的类型
 * 将返回值用 `{
 *  success: boolean;
 *  message?: string;
 *  data?: T;
 * }` 包裹
 */
type TransferApis<T extends { [key: string]: PromiseFunc }> = {
  [P in keyof T]: (...arg0: Parameters<T[P]>) => Promise<{
    success: boolean;
    message?: string;
    data?: Unpromise<ReturnType<T[P]>>;
  }>;
};
type Apis = TransferApis<Services>;

const electronObj = window.electron;
const isElectron = Boolean(electronObj);

const checkEnvAndVersion = async () => {
  if (!isElectron) {
    return;
  }
  const electronVersion = (await (electronObj.apis as Apis).getAppVersion())
    .data;
  console.log("ELECTRON_VERSION:", electronVersion);

  // 若前端指定的版本 大于 基座版本
  if (electronVersion && gt(specifyElectronVersion, electronVersion)) {
    ElNotification({
      title: `有新的版本(${specifyElectronVersion})可用，建议更新`,
      dangerouslyUseHTMLString: true,
      message: `当前版本：${electronVersion}`,
      position: "bottom-right",
      duration: 0,
    });
  }
};
checkEnvAndVersion();

export const hintAndLogErr = (message: string | undefined) => {
  ElMessage({
    showClose: true,
    message,
    type: "error",
    duration: 0,
  });
  console.error(message || "出错了");
};

const invokeApi = async (funcKey: string, ...arg: unknown[]) => {
  if (!isElectron) {
    hintAndLogErr("当前非 Electron 环境，应用无法调用接口");
    return {
      success: false,
    };
  }
  const _apis = electronObj.apis;
  if (!_apis[funcKey]) {
    hintAndLogErr(`Electron 接口[${funcKey}]不存在，请确认版本`);
    checkEnvAndVersion();
    return {
      success: false,
    };
  }
  console.log(`request: ${funcKey}`, arg);
  return _apis[funcKey](...arg)
    .then((r) => {
      console.log(`response:`, r);
      if (!r.success) {
        hintAndLogErr(r.message);
        console.error(r.message);
      }
      return r;
    })
    .catch((e: unknown) => {
      hintAndLogErr("接口出错了");
      console.error(e);
      return { success: false };
    });
};

export const apis = APIS.reduce((obj, api) => {
  return { ...obj, [api]: (...arg: unknown[]) => invokeApi(api, ...arg) };
}, {}) as Apis;

export const getImg = async (path: string) => {
  if (!isElectron) {
    return "";
  }
  return electronObj.getImg(path);
};
