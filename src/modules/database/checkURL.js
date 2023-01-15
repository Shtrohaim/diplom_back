import db from './connection.js';

async function checkTable(url, tableName) {
    return new Promise((resolve, reject) => {
        db.connection.query(`SELECT * FROM ${tableName} WHERE url='${url}'`, function (err, result, fields) {
            if (err) throw reject(err);
            if(result.length === 0) resolve(true);
            else resolve(false);
        });
    })
  }


export default { checkTable };