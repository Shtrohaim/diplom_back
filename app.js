import express from 'express';
import mysqlAdmin from 'node-mysql-admin';
import startBrowser  from './src/modules/parser/startBrowser.js';
import scraperController from './src/modules/parser/pageController.js';

const app = express()
const port = 3000

app.use(mysqlAdmin(app));

 app.get('/', (req, res) => {
    res.send('<div>Общая сумма поддержанных проектов составила 1 500 000 рублей. <br>Список победителей утвержден приказом министерства образования Красноярского края от 12.12.2022 № 816-11-05. <br>Гранты будут перечислены победителям в начале 2023 года, реализация проектов продлится в течение календарного 2023 года. <br>Благодарим участников конкурса за представленные проектные идеи, поздравляем победителей конкурса 2022 года. <br></div>');
});


let browserInstance = startBrowser.startBrowser();

scraperController(browserInstance)

 app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
    