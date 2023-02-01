import Router from 'express'
import newsController from '../controllers/newsController.js'

const router = new Router()

router.get('/table/:tableName', newsController.getRegionNewsList)
router.get('/table/:tableName/:id', newsController.getRegionNews)
router.get('/allRegions', newsController.getAllRegions)

export default router;