import os from 'os';
import util from 'util';
import path from 'path';
import { execFile as ef } from 'child_process';
import { app, dialog, shell } from 'electron';
import fg from 'fast-glob';
import { chunk } from 'lodash';

// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import { apiConfigLink } from '../../api-config';

import workerPool from './worker';
import { POOL_SIZE, JSON_FILE, DB_FILE, EVERYTHING_PATH } from './config';
import {
    SCAN_PATH_TABLE_NAME,
    PROJECT_TABLE_NAME,
    ScanPathTableRow,
    ProjectTableRow,
    getDb,
} from './db';

interface QueryObj {
    folderPath: string;
    orderBy?: string;
    orderType?: string;
    pageNo?: number;
    pageSize?: number;
    title?: string;
    checkRepeat?: boolean;
}

const execFile = util.promisify(ef);

const getPlatformPath = (path: string, back2Forward?: boolean) => {
    // windows 斜杠<-->反斜杠
    if (os.platform() === 'win32') {
        return back2Forward ? path.replace(/\\/g, '/') : path.replace(/\//g, '\\');
    }
    return path;
};

const getProjectFolders = async (
    folderPath: string
): Promise<{ projectFolders: string[]; isEs: boolean }> => {
    const globPattern = `${folderPath}/**/${JSON_FILE}`;

    // everything 接收反斜杠，输出反斜杠
    const { stderr, stdout } = await execFile(path.join(app.getAppPath(), EVERYTHING_PATH), [
        getPlatformPath(globPattern),
    ]).catch((e) => ({ stderr: e, stdout: undefined }));

    let filesPath: string[];
    let isEs = true;
    if (!stderr && stdout) {
        filesPath = stdout.split('\r\n').map((p) => getPlatformPath(p, true));
        if (filesPath[filesPath.length - 1] === '') {
            filesPath.pop();
        }
    } else {
        isEs = false;
        // fg 接收正斜杠，输出正斜杠
        filesPath = await fg(globPattern);
    }

    return {
        projectFolders: filesPath
            // .filter((file) => !file.includes('@eaDir')) // 群晖nas的 Universal Search 生成
            // 最后得到文件夹名
            .map((file) => file.replace(`${folderPath}/`, '').replace(`/${JSON_FILE}`, '')),
        isEs,
    };
};

const getScanPathId = async (folderPath: string) => {
    const db = await getDb();
    return new Promise<ScanPathTableRow['id']>((resolve, reject) => {
        db.serialize(() => {
            db.run(
                `INSERT OR IGNORE INTO ${SCAN_PATH_TABLE_NAME} (path) VALUES (?)`,
                [folderPath],
                function (err) {
                    if (err) reject(err);
                }
            );
            db.get(
                `SELECT id FROM ${SCAN_PATH_TABLE_NAME} WHERE path=?`,
                [folderPath],
                function (err, row: ScanPathTableRow) {
                    if (!err) {
                        resolve(row.id);
                    } else {
                        reject(err);
                    }
                }
            );
        });
    });
};

/**
 * 增加接口以后要在{@link apiConfigLink})添加注册，然后才能在前端项目中暴露对应调用函数
 */
const exportApis = {
    getAppVersion: async () => app.getVersion(),
    selectFolder: async () => {
        const pathRes = dialog.showOpenDialogSync({
            properties: ['openDirectory'],
        });
        if (!pathRes || pathRes.length === 0) return;
        // win平台会输出反斜杠
        return getPlatformPath(pathRes[0], true);
    },
    openFileOrFolder: async (file: string, folder?: boolean) => {
        // win平台只接收反斜杠
        const filePath = getPlatformPath(file);
        console.log(`Open file${folder ? ' folder' : ''}:[${filePath}].`);
        if (folder) {
            shell.showItemInFolder(filePath);
        } else {
            shell.openPath(filePath);
        }
    },
    openDbFileFolder: async () => {
        // win平台只接收反斜杠
        shell.showItemInFolder(getPlatformPath(DB_FILE));
    },
    checkEverything: async (param: string[]) => {
        const { stderr, stdout } = await execFile(
            path.join(app.getAppPath(), EVERYTHING_PATH),
            param
        ).catch((e) => ({ stderr: e, stdout: undefined }));
        return { stderr, stdout };
    },
    scanProjectsToDb: async (
        folderPath: string
    ): Promise<{
        length: number;
        invalidCount: number;
        newCount: number;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        processInfo: any;
    }> => {
        const processInfo = {
            scanTime: 0,
            globTime: 0,
            isEs: true,
            invalidCountTime: 0,
            deleteAndSelectTime: 0,
            needToCheckProjectsCount: 0,
            projectCheckTime: 0,
            insertTime: 0,
        };
        let timestamp = 0;

        timestamp = Date.now();
        const scanPathId = await getScanPathId(folderPath);
        processInfo.scanTime = Date.now() - timestamp;

        timestamp = Date.now();
        const { projectFolders, isEs } = await getProjectFolders(folderPath);
        processInfo.globTime = Date.now() - timestamp;
        processInfo.isEs = isEs;

        timestamp = Date.now();
        const thisRoundFolders = '"' + projectFolders.join('","') + '"';

        const db = await getDb();

        const invalidCount = await new Promise<number>((resolve, reject) => {
            db.get(
                `SELECT COUNT(*) AS count FROM ${PROJECT_TABLE_NAME}
                    WHERE scan_path_id=? AND project_folder NOT IN (${thisRoundFolders})
                `,
                [scanPathId],
                function (err, row: { count: number }) {
                    if (!err) {
                        resolve(row.count);
                    } else {
                        reject(err);
                    }
                }
            );
        });
        processInfo.invalidCountTime = Date.now() - timestamp;

        timestamp = Date.now();
        const existFoldersAfterDelete = await new Promise<string[]>((resolve, reject) => {
            db.serialize(() => {
                db.run(
                    `DELETE FROM ${PROJECT_TABLE_NAME}
                        WHERE scan_path_id=? AND project_folder NOT IN (${thisRoundFolders})
                    `,
                    [scanPathId],
                    function (err) {
                        if (err) reject(err);
                    }
                );

                db.all(
                    `SELECT project_folder FROM ${PROJECT_TABLE_NAME} WHERE scan_path_id=?`,
                    [scanPathId],
                    function (err, data: { project_folder: string }[]) {
                        if (!err) {
                            resolve(data.map(({ project_folder }) => project_folder));
                        } else {
                            reject(err);
                        }
                    }
                );
            });
        });
        processInfo.deleteAndSelectTime = Date.now() - timestamp;

        timestamp = Date.now();
        const needToCheckProjects = projectFolders.filter(
            (f) => !existFoldersAfterDelete.includes(f)
        );
        const threadsTaskPromiseList = chunk(
            needToCheckProjects,
            Math.ceil(needToCheckProjects.length / POOL_SIZE)
        ).map((chunkJsons) =>
            workerPool.exec({ folderPath, jsonFile: JSON_FILE, projectFolders: chunkJsons })
        );
        const projectArr = (await Promise.all(threadsTaskPromiseList)).flat();
        processInfo.needToCheckProjectsCount = needToCheckProjects.length;
        processInfo.projectCheckTime = Date.now() - timestamp;

        timestamp = Date.now();
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                const stmt = db.prepare(
                    `INSERT OR IGNORE INTO ${PROJECT_TABLE_NAME} (
                        scan_path_id,
                        project_folder,
                        file,
                        file_size,
                        preview,
                        title,
                        create_time
                    ) VALUES (
                        $scan_path_id,
                        $project_folder,
                        $file,
                        $file_size,
                        $preview,
                        $title,
                        $create_time
                    )`
                );
                projectArr.forEach(
                    ({ projectFolder, file, fileSize, preview, title, createTime }) => {
                        const param: Record<string, string | number> = {
                            $scan_path_id: scanPathId,
                            $project_folder: projectFolder,
                        };
                        if (file) {
                            Object.assign(param, {
                                $file: file,
                                $file_size: fileSize,
                                $preview: preview,
                                $title: title,
                                $create_time: createTime,
                            });
                        }
                        stmt.run(param);
                    }
                );
                stmt.finalize(function (err) {
                    if (err) reject(err);
                });

                processInfo.insertTime = Date.now() - timestamp;
                resolve({
                    length: projectFolders.length,
                    invalidCount,
                    newCount: needToCheckProjects.length,
                    processInfo,
                });
            });
        });
    },
    getProjectsByPage: async ({
        folderPath,
        orderBy = 'create_time',
        orderType = 'DESC',
        pageNo = 1,
        pageSize = 20,
        title = '',
        checkRepeat,
    }: QueryObj) => {
        const scanPathId = await getScanPathId(folderPath);
        let conditionStr = `WHERE scan_path_id=? AND file NOT NULL`;
        const sqlParams: unknown[] = [scanPathId];

        const queryTitle = title.trim();
        if (queryTitle) {
            conditionStr += ` AND title LIKE ? `;
            sqlParams.push(`%${queryTitle}%`);
        }

        if (checkRepeat) {
            conditionStr = `
                WHERE file_size IN (
                    SELECT file_size FROM ${PROJECT_TABLE_NAME}
                    ${conditionStr}
                    GROUP BY file_size HAVING count(*) > 1
                )
            `;
        }

        const db = await getDb();

        const total = await new Promise<number>((resolve) => {
            db.get(
                `SELECT COUNT(*) AS total FROM ${PROJECT_TABLE_NAME}
                    ${conditionStr}
                `,
                sqlParams,
                function (err, row: { total: number }) {
                    if (!err) {
                        resolve(row.total);
                    } else {
                        console.error(err);
                        resolve(0);
                    }
                }
            );
        });

        const querySets = 'project_folder, file, file_size, preview, title';
        return new Promise<{ total: number; list: ProjectTableRow[] }>((resolve) => {
            db.all(
                `SELECT ${querySets} FROM ${PROJECT_TABLE_NAME}
                    ${conditionStr}
                    ORDER BY ${orderBy} ${orderType}
                    LIMIT ${(pageNo - 1) * pageSize}, ${pageSize}
                `,
                sqlParams,
                function (err, data: ProjectTableRow[]) {
                    if (!err) {
                        resolve({ total, list: data });
                    } else {
                        console.error(err);
                        resolve({ total, list: [] });
                    }
                }
            );
        });
    },
};

export default exportApis;

export type Services = typeof exportApis;
