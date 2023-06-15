import express from 'express';
// import mysqlAdmin from 'node-mysql-admin';
import path from 'path'
import startBrowser  from './src/modules/parser/startBrowser.js';
import scraperController from './src/controllers/pageController.js';
import fipiScraper from './src/controllers/fipiBrowserController.js';
import { api } from './src/routes/router.js';
import cors from 'cors'

const app = express()
const port = process.env.PORT || 3000

// app.use(mysqlAdmin(app));
app.use(express.json())

app.use(cors());

app.use('/api', api)
app.use('/img', express.static('./src/data/img/emblems/'))


const UpdateFipiInfo = () => {
   let browserInstance = startBrowser.startBrowser();
   fipiScraper(browserInstance)
}

const ParsingActivate = () => {
   let browserInstance = startBrowser.startBrowser();
   scraperController(browserInstance)

   let nowDate = new Date()
   let needDate = new Date(`${nowDate.getFullYear()}-${nowDate.getMonth() + 1}-2`)
   nowDate = nowDate.toISOString().split('T')[0]
   needDate = needDate.toISOString().split('T')[0]
   if (nowDate === needDate){
      UpdateFipiInfo()
   }
}

// UpdateFipiInfo()
// ParsingActivate()


// setInterval(ParsingActivate, 7200000)


 app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
    