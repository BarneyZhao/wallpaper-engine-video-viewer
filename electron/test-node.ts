import { execFile as ef } from 'child_process';
import util from 'util';

// import { getDb, closeDb } from './src/db';

const execFile = util.promisify(ef);

(async () => {
    // const db = await getDb();
    // db.serialize(() => {
    //     db.all(
    //         `SELECT json_path,create_time,${TABLE_SETS.join(
    //             ','
    //         )} FROM ${TABLE_NAME} WHERE file NOT NULL ORDER BY create_time desc limit 0,10`,
    //         function (err: any, data: any) {
    //             if (!err) {
    //                 console.log(JSON.stringify(data));
    //             }
    //         }
    //     );
    // });
    // closeDb();
    const { stdout, stderr } = await execFile('./everything/es.exe', [
        'C:\\Users\\Barney\\dev-assets\\wallpaper-engine\\**\\project.json',
    ]).catch((e) => ({ stderr: e, stdout: undefined }));
    console.log('-----err-------');
    console.log(stderr);
    console.log('------------');

    console.log(stdout);
})();
