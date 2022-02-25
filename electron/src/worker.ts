import FS, { Stats } from 'fs';
import { StaticPool } from 'node-worker-threads-pool';

import { Project } from 'types';
import { POOL_SIZE } from './config';

const staticPool = new StaticPool({
    size: POOL_SIZE,
    task({
        folderPath,
        jsonFile,
        projectFolders,
    }: {
        folderPath: string;
        jsonFile: string;
        projectFolders: string[];
    }) {
        const _fs: typeof FS = this.require('fs');
        const videoReg = new RegExp(/video/i);
        return projectFolders.map((projectFolder) => {
            const projectPath = `${folderPath}/${projectFolder}`;
            let jsonObj: Project = {} as Project;
            let createTime: number = Date.now();
            let fileSize = 1;
            try {
                jsonObj = JSON.parse(
                    _fs.readFileSync(`${projectPath}/${jsonFile}`, { encoding: 'utf8' })
                );
            } catch (error) {
                console.error(error);
            }
            if (!jsonObj.type || !videoReg.test(jsonObj.type)) {
                return { projectFolder };
            }
            const { file, preview, title } = jsonObj;

            try {
                const fileInfo: Stats = _fs.statSync(`${projectPath}/${file}`);
                createTime = fileInfo.ctimeMs;
                fileSize = Math.round(fileInfo.size / 1024); // bytes to kb, bytes too large for INTEGER
            } catch (error) {
                console.error(error);
            }

            return {
                projectFolder,
                file,
                fileSize,
                preview,
                title,
                createTime,
            };
        });
    },
});

export default staticPool;
