import Router from 'express'
import newsController from '../controllers/newsController.js'

const router = new Router()

router.get('/table/:tableName', newsController.getRegionNews)
router.get('/allRegions', newsController.getAllRegions)

export default router;