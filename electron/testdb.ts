import { getDb, closeDb } from './src/db';

(async () => {
    const db = await getDb();
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

    closeDb();
})();
