import db from '../modules/database/connection.js';

const getRegionNews  = async (tableName) => {

    if(!tableName){
        throw new Error('Не указано имя таблицы!')
    }
    return new Promise((resolve, reject) => {
        db.connection.query(`SELECT * FROM ${tableName}`, function (err, result, fields) {
            if (err) reject(err);
            resolve(result);
        });
    });

}

const getAllRegions  = async () => {
    return new Promise((resolve, reject) => {
        db.connection.query(`SELECT * FROM all_regions;`, function (err, result, fields) {
            if (err) reject(err);
            resolve(result);
        });
    });

}

export default { getRegionNews, getAllRegions };