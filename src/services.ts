import { ElMessage } from "element-plus";

const appVersion = __APP_VERSION__;
const isElectron = Boolean(window.electron);
const electronAppVersionPromise: Promise<any> = isElectron
  ? window.electron.apis.getAppVersion()
  : new Promise((r) => r(""));

export const hintAndLogSuccess = (message: string) => {
  ElMessage({
    showClose: true,
    message,
    type: "success",
    duration: 2500,
  });
  console.log(message);
};
export const hintAndLogErr = (message: string) => {
  ElMessage({
    showClose: true,
    message,
    type: "error",
    duration: 2500,
  });
  console.error(message);
};

const checkEnvAndVersion = async () => {
  if (!isElectron) {
    hintAndLogErr("当前非 Electron 环境，接口不可用");
    return false;
  }
  const electronVersion = (await electronAppVersionPromise).data;
  if (appVersion !== electronVersion) {
    hintAndLogErr(
      `前端版本(${appVersion})和基座版本(${electronVersion})不匹配`
    );
    return false;
  }
  return true;
};

const invokeApi = async (funcKey: string, ...arg: unknown[]) => {
  if (!(await checkEnvAndVersion())) {
    return;
  }
  console.log(`request: ${funcKey}`, arg);
  return window.electron.apis[funcKey](...arg).then((r: unknown) => {
    console.log(`response:`, r);
    return r;
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
  if (!(await checkEnvAndVersion())) {
    return "";
  }
  return window.electron.getImg(path);
};
