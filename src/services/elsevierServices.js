import request from "request";
import queryString from 'query-string';

const API_KEY = '7f59af901d2d86f78a1fd60c1bf9426a'
  

const getScopusDataList = async (query) => {
    let a = queryString.parse('foo[]=1&foo[]=2&foo[]=3', {arrayFormat: 'bracket'})
    console.log(a['foo'])
    return new Promise((resolve, reject) => {
        let data = {}
        let {limit, offset} = query;

        let options = {
            uri: `https://api.elsevier.com/content/search/scopus?query=all(gene)&apiKey=${API_KEY}&start=${offset-1}&count=${limit}`,
            method: 'GET',
            json: true,
            body: {'my_date' : 'json'}
        }

        request(options, (error, response, body) => {
            if (error) reject(`ERROR: ${error}`);

            data['currentPage'] = Number(body['search-results']['opensearch:startIndex']) + 1
            data['totalItems'] = Number(body['search-results']['opensearch:totalResults'])
            data['totalPages'] = Math.ceil(data['totalItems'] / limit);
            data['data'] = []
       
            for (const [key, value] of Object.entries(body['search-results']['entry'])) {
                let items = {}

                items['title'] = value['dc:title']
                items['scopus-id'] = value['dc:identifier']
                items['eid'] = value['eid']
                items['creator'] = value['dc:creator']
                items['publisher'] = value['prism:publicationName']
                items['issn'] = value['prism:issn']
                items['eIssn'] = value['prism:eIssn']
                items['volume'] = value['prism:volume']
                items['doi'] = value['prism:doi']
                items['citedby-count'] = value['citedby-count']
                items['aggregationType'] = value['prism:aggregationType']
                items['subtypeDescription'] = value['subtypeDescription']
                items['openaccessFlag'] = value['openaccessFlag']
                items['affiliation'] = value['affiliation']

                data['data'].push(items)
            }      
            resolve(data)
        });
    });
}

const getScidirData  = async () => {
   

}

const getAllSubjects = async () => {
    return new Promise((resolve, reject) => {
        let options = {
            uri: `https://api.elsevier.com/content/subject/scopus?apiKey=${API_KEY}`,
            method: 'GET',
            json: true,
            body: {'my_date' : 'json'}
        }
        let data = {}
    
        request(options, (error, response, body) => {
            if (error) reject(`ERROR: ${error}`);
            for (const [key, value] of Object.entries(body['subject-classifications']['subject-classification'])) {
                if(data[value.description] === undefined) {
                    data[value.description] = [ {"code": value.code, "subName": value.detail } ]
                }else{
                    data[value.description].push({"code": value.code, "subName": value.detail })
                }
            }
            resolve(data)
        });
    });
}

export default { getScopusDataList, getScidirData, getAllSubjects };