import { readFile } from 'fs/promises';
import { contextBridge, ipcRenderer } from 'electron';

// services.ts 中 增加接口以后要在这里添加注册，然后才能在前端项目中暴露对应调用函数
import apis from '../../api-config';

const exposeObj = {
    // preload 和 services 需要通过 ipcRenderer 沟通
    apis: apis.reduce((obj, api) => {
        return { ...obj, [api]: (...arg: unknown[]) => ipcRenderer.invoke(`api:${api}`, ...arg) };
    }, {}),
    getImg: async (path: string) => {
        // const nativeImg = nativeImage.createFromPath(path);
        // return nativeImg.toDataURL();
        const imgBuffer = await readFile(path).catch(() => '');
        if (imgBuffer === '') return imgBuffer;
        return 'data:image/png;base64,' + imgBuffer.toString('base64');
    },
};

// 前端中调用 window.electron = exposeObj
contextBridge.exposeInMainWorld('electron', exposeObj);
