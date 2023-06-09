import db from '../modules/database/connection.js';

const getRegionNewsList  = async (tableName, query) => {

    const { page, size} = query
    let { search } = query
    search = search ? search : ""
    const limit = size ? + size : 10;
    const offset = page ? (page - 1) * limit : 0;

    if(!tableName){
        throw new Error('Не указано имя таблицы!')
    }
    return new Promise((resolve, reject) => {
        db.connection.query(`SELECT SQL_CALC_FOUND_ROWS * FROM ${tableName} WHERE title LIKE '%${search}%' ORDER BY id DESC  LIMIT ${limit} OFFSET ${offset}`, function (err, result, fields) {
            if (err){
                reject('ERROR: Неправильное имя таблицы!');
                return
            }

            db.connection.query(`SELECT FOUND_ROWS();`, function (err, res, fields) {
                const news = {}

                result.forEach((el, index) => {
                    let image_url = el.image_url ? el.image_url[0] : "";
                    let description;
                    if(Object.keys(el.description).length >= 2) {
                        description = `${el.description[0].replace(/(<br>)/gi, "")} ${el.description[1].replace(/(<br>)/gi, "")}`
                    }else if(Object.keys(el.description).length !== 0){
                        description = el.description[0].replace(/(<br>)/gi, "");
                    }else{
                        description = ""
                    }

                    const newsFill = { 
                        "id": el.id,
                        "image_url": image_url,
                        "title": el.title,
                        "date": el.date, 
                        "teaser": description,
                    }
                    
                    news[index] = newsFill;
                })
                
                const totalItems = res[0]['FOUND_ROWS()']
                const currentPage = page ? + page : 0;
                const totalPages = Math.ceil(totalItems / limit);
    
                resolve({ totalItems, news, totalPages, currentPage });
            });
            
        });
    });
}

const getRegionNews = async (tableName, id) => {
    if(!tableName){
        throw new Error('ERROR: Не указано имя таблицы!')
    }
    if(!id){
        throw new Error('ERROR: Не указан id новости!')
    }
    return new Promise((resolve, reject) => {
        db.connection.query(`SELECT * FROM ${tableName} WHERE id=${id};`, function (err, result, fields) {
            if (err){
                reject('ERROR: Неправильное имя таблицы или id!');
                return
            }
            resolve(result);
        });
    });
}

const getAllRegions  = async () => {
    return new Promise((resolve, reject) => {
        db.connection.query(`SELECT * FROM all_regions;`, function (err, result, fields) {
            if (err) {
                reject("ERROR: Были отправлены неправильные данные!");
                return
            }
            resolve(result);
        });
    });

}

export default { getRegionNews, getAllRegions, getRegionNewsList };