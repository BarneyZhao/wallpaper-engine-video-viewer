import os from 'os';
import { app, dialog, shell } from 'electron';
import fg from 'fast-glob';
import { chunk } from 'lodash';

import workerPool from './worker';
import { POOL_SIZE, JSON_FILE, DB_FILE } from './config';
import {
    SCAN_PATH_TABLE_NAME,
    PROJECT_TABLE_NAME,
    ScanPathTableRow,
    // ProjectTableRow,
    getDb,
} from './db';

const getPlatformPath = (path: string) => {
    // windows 斜杠替换为反斜杠
    return os.platform() === 'win32' ? path.replace(/\//g, '\\') : path;
};

const getProjectFolders = async (folderPath: string): Promise<string[]> => {
    const filesPath = await fg(`${folderPath}/**/${JSON_FILE}`);
    return (
        filesPath
            .filter((file) => !file.includes('@eaDir'))
            // 最后得到文件夹名
            .map((file) => file.replace(`${folderPath}/`, '').replace(`/${JSON_FILE}`, ''))
    );
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

const exportApis = {
    getAppVersion: async () => app.getVersion(),
    selectFolder: async () => {
        const pathRes = dialog.showOpenDialogSync({
            properties: ['openDirectory'],
        });
        if (!pathRes || pathRes.length === 0) return;
        return pathRes[0].replace(/\\/g, '/'); // 反斜杠替换为斜杠
    },
    openFileOrFolder: async (file: string, folder?: boolean) => {
        const filePath = getPlatformPath(file);
        console.log(`Open file${folder ? ' folder' : ''}:[${filePath}].`);
        if (folder) {
            shell.showItemInFolder(filePath);
        } else {
            shell.openPath(filePath);
        }
    },
    openDbFileFolder: async () => {
        shell.showItemInFolder(getPlatformPath(DB_FILE));
    },
    scanProjectsToDb: async (folderPath: string) => {
        const processInfo = {
            scanTime: 0,
            globTime: 0,
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
        const projectFolders = await getProjectFolders(folderPath);
        processInfo.globTime = Date.now() - timestamp;

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
    getProjectsByPage: async (
        folderPath: string,
        orderBy = 'create_time',
        orderType = 'DESC',
        pageNo = 1,
        pageSize = 20,
        title = ''
    ) => {
        const scanPathId = await getScanPathId(folderPath);
        const querySets = 'project_folder, file, file_size, preview, title';
        let conditionStr = `WHERE scan_path_id=? AND file NOT NULL`;
        const sqlParams: unknown[] = [scanPathId];

        const queryTitle = title.trim();
        if (queryTitle) {
            conditionStr += ` AND title LIKE ? `;
            sqlParams.push(`%${queryTitle}%`);
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

        return new Promise<{ total: number; list: unknown[] }>((resolve) => {
            db.all(
                `SELECT ${querySets} FROM ${PROJECT_TABLE_NAME}
                    ${conditionStr}
                    ORDER BY ${orderBy} ${orderType}
                    LIMIT ${(pageNo - 1) * pageSize}, ${pageSize}
                `,
                sqlParams,
                function (err, data: unknown[]) {
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
