import mysql from "mysql2";

const connection = mysql.createConnection({
    host: "bidgnranhpx685wfq8ov-mysql.services.clever-cloud.com",
    user: "uuvwhsjagostxvbf",
    database: "bidgnranhpx685wfq8ov",
    password: "sOtIClA3OS2VxOXLKD6i"
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