import Router from 'express'
import newsController from '../controllers/newsController.js'
import fipiInfoController from '../controllers/fipiInfoController.js'
import elsevierApiController from '../controllers/elsevierApiController.js'

const router = new Router()

router.get('/table/:tableName', newsController.getRegionNewsList)
router.get('/table/:tableName/:id', newsController.getRegionNews)
router.get('/allRegions', newsController.getAllRegions)
router.get('/ege', fipiInfoController.getEgeInfo)
router.get('/oge', fipiInfoController.getOgeInfo)
router.get('/elsevier/scopusList', elsevierApiController.getScopusDataList)
router.get('/elsevier/publisher/:issn', elsevierApiController.getPublisherInfo)
router.get('/elsevier/subjects', elsevierApiController.getAllSubjects)

export default router;