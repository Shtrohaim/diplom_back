import mysql from "mysql2";

const connection = mysql.createConnection({
    host: "containers-us-west-74.railway.app",
    user: "root",
    database: "railway",
    password: "kbHL5IVaAlMvxI2HoXzV",
    port: 5599,
    connectTimeout: 60000
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