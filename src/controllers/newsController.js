import newsServices from '../services/newsServices.js'

const getRegionNewsList  = async (req, res) => {
    try{
        const news = await newsServices.getRegionNewsList(req.params.tableName, req.query)
        return res.status(200).json(news)
    }catch(e){
        res.status(500).json(e)
    }
}

const getRegionNews  = async (req, res) => {
    try{
        const news = await newsServices.getRegionNews(req.params.tableName, req.params.id)
        return res.status(200).json(news)
    }catch(e){
        res.status(500).json(e)
    }
}

const getAllRegions  = async (req, res) => {
    try{
        const news = await newsServices.getAllRegions()
        return res.status(200).json(news)
    }catch(e){
        res.status(500).json(e)
    }
}


export default { getRegionNews , getAllRegions, getRegionNewsList} 