import elsevierServices from '../services/elsevierServices.js'

const getScopusDataList  = async (req, res) => {
    try{
        const data = await elsevierServices.getScopusDataList(req.query)
        return res.status(200).json(data)
    }catch(e){
        res.status(500).json(e)
    }
}

const getPublisherInfo  = async (req, res) => {
    try{
        const data = await elsevierServices.getPublisherInfo(req.params.issn)
        return res.status(200).json(data)
    }catch(e){
        res.status(500).json(e)
    }
}

const getAllSubjects = async (req, res) => {
    try{
        const subjects = await elsevierServices.getAllSubjects()
        return res.status(200).json(subjects)
    }catch(e){
        res.status(500).json(e)
    }
}

export default { getScopusDataList , getPublisherInfo, getAllSubjects } 