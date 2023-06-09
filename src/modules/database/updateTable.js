import db from './connection.js';

export default function createTable(data, tableName){
    data.forEach(el => {
        let jsonInfo = JSON.stringify('');
        if(el.info !== undefined){
            jsonInfo = JSON.stringify(el.info);
        }
        db.connection.query(`INSERT INTO ${tableName} (title, description, info, url) VALUES ('${el.pageTitle}', '${el.pageDescription}','${jsonInfo}','${el.url}') ON DUPLICATE KEY UPDATE title = '${el.pageTitle}', description = '${el.pageDescription}', info = '${jsonInfo}'`);
    });
   
		

}
