import express from 'express';
import mysqlAdmin from 'node-mysql-admin';
import startBrowser  from './src/modules/parser/startBrowser.js';
import scraperController from './src/controllers/pageController.js';
import { api } from './src/routes/router.js';
import cors from 'cors'

const app = express()
const port = 3000

app.use(mysqlAdmin(app));
app.use(express.json())

app.use(cors());

app.use('/api', api)
app.use('/img', express.static('./src/data/img/emblems/'))



const ParsingActivate = () => {
   let browserInstance = startBrowser.startBrowser();
   scraperController(browserInstance)
}

// ParsingActivate()


setInterval(ParsingActivate, 7200000)


 app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
    