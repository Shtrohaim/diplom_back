import db from '../modules/database/connection.js';

const getEgeInfo = async () => {
    return new Promise((resolve, reject) => {
        db.connection.query(`SELECT * FROM fipi_ege;`, function (err, result, fields) {
            if (err) reject(`ERROR: ${err}`);
            resolve(result);
        });
    });
}

const getOgeInfo  = async () => {
    return new Promise((resolve, reject) => {
        db.connection.query(`SELECT * FROM fipi_oge;`, function (err, result, fields) {
            if (err) reject(`ERROR: ${err}`);
            resolve(result);
        });
    });

}

export default { getEgeInfo, getOgeInfo };