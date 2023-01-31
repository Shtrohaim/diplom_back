import db from '../modules/database/connection.js';

const getRegionNews  = async (tableName, query) => {

    const { page, size} = query
    const limit = size ? + size : 10;
    const offset = page ? (page - 1) * limit : 0;

    if(!tableName){
        throw new Error('Не указано имя таблицы!')
    }
    return new Promise((resolve, reject) => {
        db.connection.query(`SELECT SQL_CALC_FOUND_ROWS * FROM ${tableName} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`, function (err, result, fields) {
            if (err) reject(err);
            db.connection.query(`SELECT FOUND_ROWS();`, function (err, res, fields) {
                const news = result;
                const totalItems = res[0]['FOUND_ROWS()']
                const currentPage = page ? + page : 0;
                const totalPages = Math.ceil(totalItems / limit);
    
                resolve({ totalItems, news, totalPages, currentPage });
            });
            
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