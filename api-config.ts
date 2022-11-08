/**
 * 此文件内代码要兼容 node 和 浏览器环境
 */
import { ProjectTableRow as P } from "./electron/src/db";
import { Services as S } from "./electron/src/services";

export type apiConfigLink = "just for [ctrl/cmd] + [click] link.";

export type ProjectTableRow = P;
export type Services = S;

/**
 * 在 /electron/src/services.ts 中增加接口以后
 * 要在这里添加注册，然后才能在前端项目中暴露对应调用函数
 */
export const apis: Array<keyof S> = [
  "getAppVersion",
  "showContextmenus",
  "selectFolder",
  "openFile",
  "copyFolderToPath",
  "openDbFileFolder",
  "scanProjectsToDb",
  "getProjectsByPage",
  "checkEverything",
];
export default apis;
