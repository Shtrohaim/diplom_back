import fipiServices from '../services/fipiInfoServices.js'

const getEgeInfo  = async (req, res) => {
    try{
        const ege = await fipiServices.getEgeInfo()
        return res.status(200).json(ege)
    }catch(e){
        res.status(500).json(e)
    }
}

const getOgeInfo  = async (req, res) => {
    try{
        const oge = await fipiServices.getOgeInfo()
        return res.status(200).json(oge)
    }catch(e){
        res.status(500).json(e)
    }
}


export default { getEgeInfo , getOgeInfo } 