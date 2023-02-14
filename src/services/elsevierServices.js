import request from "request";

const API_KEY = '7f59af901d2d86f78a1fd60c1bf9426a'
  

const getScopusDataList = async (query) => {
    let search = JSON.parse(`${query["search"]}`)

    // 'search={field: "aaaaa", type: "ALL"}'
    // 'filter={doctype: [], openaccess: null, SRCTYPE: [] , ... , PUBYEAR: {year: 2023, operator: more}}'

    // searchParams = ["ALL","DOI","ISSN", "EISSN", "AUTHOR-NAME", "PUBLISHER"]
    // filterParams = ['DOCTYPE', 'OPENACCESS', 'SRCTYPE', 'SUBJAREA', "PUBYEAR"]

    let encode = `${search["type"]}(${search["field"]})`

    if(query["filter"]) {
        let filter = JSON.parse(`${query["filter"]}`)

        for (const [key, value] of Object.entries(filter)) {
            if(value && Array.isArray(value)){
    
                encode += ` AND ${key}(${value[0]}`

                for(let i = 1; i < value.length; i++){
                    encode += ` OR ${value[i]}`
                } 
                encode += ')'
            }else if(value && typeof(value) === 'object'){
                let operator = '='
                if(value["operator"] === "more") {
                    operator = '>'
                }else if(value["operator"] === "less"){
                    operator = '<'
                }
                encode += ` AND ${key} ${operator} ${value["year"]}`
            }else if(value) {
                encode += ` AND ${key}(${value})`
            }
            
        }
    }

    return new Promise((resolve, reject) => {
        let data = {}
        let {limit, offset} = query;

        let options = {
            uri: `https://api.elsevier.com/content/search/scopus?query=${encode}&apiKey=${API_KEY}&start=${offset-1}&count=${limit}`,
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

const getPublisherInfo  = async (issn) => {
    return new Promise((resolve, reject) => {
        let options = {
            uri: `https://api.elsevier.com/content/serial/title?issn=${issn}&apiKey=${API_KEY}`,
            method: 'GET',
            json: true,
            body: {'my_date' : 'json'}
        }
        let data = {}
    
        request(options, (error, response, body) => {
            if (error) reject(`ERROR: ${error}`);

            let res = body["serial-metadata-response"]["entry"][0]

            data['title'] = res['dc:title']
            data['publisher'] = res['dc:publisher']
            data['coverageStartYear'] = res['coverageStartYear']
            data['coverageEndYear'] = res['coverageEndYear']
            data['aggregationType'] = res['prism:aggregationType']
            data['issn'] = res['prism:issn']
            data['eIssn'] = res['prism:eIssn']
            data['openaccess'] = res['openaccess']
            data['subject-area'] = res['subject-area']
            data['SNIP'] = res['SNIPList']['SNIP'][0]
            data['SJR'] = res['SJRList']['SJR'][0]
            data['citeScoreYearInfoList'] = res['citeScoreYearInfoList']

            for(let i in res['link']){
                if(res['link'][i]['@ref'] === "scopus-source"){
                    data['scopus-link'] = res['link'][i]["@href"]
                }
                if(res['link'][i]['@ref'] === "homepage"){
                    data['origin-link'] = res['link'][i]["@href"]
                }
            }

            resolve(data)
        });
    });

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
                    data[value.description] = [ {"code": value.code, "abbrev": value.abbrev } ]   
                }
            }
            resolve(data)
        });
    });
}

export default { getScopusDataList, getPublisherInfo, getAllSubjects };