import { gt } from "semver";
import { ElMessage, ElNotification } from "element-plus";
import "element-plus/es/components/message/style/css";
import "element-plus/es/components/notification/style/css";

import { specifyElectronVersion } from "./const";

const isElectron = Boolean(window.electron);

const checkEnvAndVersion = async () => {
  if (!isElectron) {
    return;
  }
  const electronVersion = (await window.electron.apis.getAppVersion())
    .data as string;
  console.log("ELECTRON_VERSION:", electronVersion);

  // 若前端指定的版本 大于 基座版本
  if (gt(specifyElectronVersion, electronVersion)) {
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
    } as ApiResponse;
  }
  if (!window.electron.apis[funcKey]) {
    hintAndLogErr(`Electron 接口[${funcKey}]不存在，请确认版本`);
    checkEnvAndVersion();
    return {
      success: false,
    } as ApiResponse;
  }
  console.log(`request: ${funcKey}`, arg);
  return window.electron.apis[funcKey](...arg)
    .then((r) => {
      console.log(`response:`, r);
      if (!r.success) {
        hintAndLogErr(r.message);
        console.error(r.message);
      }
      return r;
    })
    .catch((e) => {
      hintAndLogErr("接口出错了");
      console.error(e);
      return { success: false } as ApiResponse;
    });
};

export const openFileOrFolder = (...arg: unknown[]) =>
  invokeApi("openFileOrFolder", ...arg);

export const getProjectsByPage = (...arg: unknown[]) =>
  invokeApi("getProjectsByPage", ...arg);

export const scanProjectsToDb = (...arg: unknown[]) =>
  invokeApi("scanProjectsToDb", ...arg);

export const selectFolder = (...arg: unknown[]) =>
  invokeApi("selectFolder", ...arg);

export const getImg = async (path: string) => {
  if (!isElectron) {
    return "";
  }
  return window.electron.getImg(path);
};
