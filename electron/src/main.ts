// Modules to control application life and create native browser window
import { app, BrowserWindow, Menu, MenuItem, ipcMain } from 'electron';
import Url from 'url';
import Path from 'path';
import { existsSync } from 'fs';
import { debounce } from 'lodash';
import Store from 'electron-store';

import { Service } from 'types';

import {
    DevTypeEnum,
    APP_MENUS,
    DEV_TYPE,
    DEV_URL,
    DOCS_URL,
    IS_DEV,
    MAC_MENUS,
    REMOTE_URL,
    WINDOW_OPS,
} from './config';
import services from './services';
import { closeDb } from './db';

const store = new Store();

const getLocalDocsFile = () => {
    if (existsSync(DOCS_URL)) {
        return Url.format({
            protocol: 'file',
            slashes: true,
            // pathname: Path.join(__dirname, DOCS_URL), // 构建包内的路径
            pathname: DOCS_URL, // 项目根路径
        });
    }
    console.log('\n No local docs file.');
    return '';
};

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow | null;

const setUserWindowSettings = debounce(() => {
    if (mainWindow) {
        const { x, y, width, height } = mainWindow.getBounds();
        store.set('window.x', x);
        store.set('window.y', y);
        store.set('window.width', width);
        store.set('window.height', height);
    }
}, 1000);

const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        webPreferences: {
            preload: Path.join(__dirname, 'preload.js'),
        },
        ...WINDOW_OPS,
        ...((store.get('window') as object) || {}),
    });

    // and load the index.html of the app.
    let appUrl = '';
    // mainWindow.loadURL
    if (IS_DEV) {
        if (DEV_TYPE === DevTypeEnum.DEV_URL) {
            appUrl = DEV_URL;
        } else if (DEV_TYPE === DevTypeEnum.DOCS_URL) {
            appUrl = getLocalDocsFile();
        }
    } else {
        // prod
        // 本地 app 存在则加载本地
        appUrl = getLocalDocsFile();
    }
    // 远程 gh-pages 保底
    mainWindow.loadURL(appUrl || REMOTE_URL);

    // Open the DevTools.
    if (IS_DEV) mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
        closeDb();
    });
    mainWindow.on('resize', setUserWindowSettings);
    mainWindow.on('move', setUserWindowSettings);
};

const setAppMenus = () => {
    const template: MenuItem[] = APP_MENUS as unknown as MenuItem[];
    if (process.platform === 'darwin') {
        template.unshift(MAC_MENUS as unknown as MenuItem);
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    try {
        createWindow();
        setAppMenus();
    } catch (error) {
        console.error(error);
    }
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
// require(`${app.getAppPath()}/src/controllers/baseController.js`);

const registerServices = (services: Record<string, Service>) => {
    Object.entries(services).forEach(([key, service]) => {
        ipcMain.handle(`api:${key}`, async (event, ...arg) => {
            return await service(...arg)
                .then((data) => ({ success: true, data, msg: '' }))
                .catch((err) => {
                    console.error(err);
                    return {
                        success: false,
                        data: null,
                        msg: err.message || err,
                    };
                });
        });
    });
};

registerServices(services);
