import { ElMessage, ElNotification } from "element-plus";
import "element-plus/es/components/message/style/css";
import "element-plus/es/components/notification/style/css";

const specifyElectronVersion = "1.1.1"; // 指定 electron 基座的版本
const isElectron = Boolean(window.electron);

const checkEnvAndVersion = async () => {
  if (!isElectron) {
    return;
  }
  const electronVersion = (await window.electron.apis.getAppVersion()).data;
  console.log("ELECTRON_VERSION", electronVersion);

  if (specifyElectronVersion !== electronVersion) {
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
