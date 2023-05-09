import db from './connection.js';

export default function createTable(data, tableName){
    data.forEach( el => {
        let jsonDesc = {};
        let i = 0;

        el.newsDesc.forEach(element => {
            if(element.replace(/(\",\')/gm, "") !== ""){
                jsonDesc[i.toString()] = element.replace(/(\",\')/gm, "");
                i++;
            }
        });
        jsonDesc = JSON.stringify(jsonDesc).replace(/(\\)/gm, "");
       db.connection.query(`INSERT INTO ${tableName} VALUES (?,?,?,?,?)`, el.newsTittle, jsonDesc, JSON.stringify(el.imageUrl), el.newsDate, el.url);
    });

}
