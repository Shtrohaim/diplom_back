import mysql from "mysql2";

const connection = mysql.createConnection({
    host: "containers-us-west-107.railway.app",
    user: "root",
    database: "railway",
    password: "CV1ezFLW2IcROLcmSNqo"
  });

  connection.connect(function(err){
    if (err) {
      return console.error("Ошибка: " + err.message);
    }
    else{
      console.log("Подключение к серверу MySQL успешно установлено");
    }
 });

  
export default { connection };