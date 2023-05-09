import request from "request";

const API_KEY = 'b0945bf621784946be4446031458e9eb'

const typeTranslator = (type) => {
    switch (type) {
        case 'tradejournal':
            return 'Ревю'
        case 'journal':
            return 'Журнал'
        case 'conferenceproceeding':
           return 'Материалы конференции'
        case 'bookseries':
            return 'Серия книг'
    }
}
const subtypeTranslator = (subtypeDescription) => {
        switch (subtypeDescription) {
            case 'Article':
                return 'Статья'
            case 'Abstract Report':
              return  'Выдержка из доклада'
            case 'Book':
                return  'Книга'
            case 'Business Article':
                return  'Бизнес статья'
            case 'Book Chapter':
                return 'Глава книги'
            case 'Conference Paper':
                return 'Материал конференции'
            case 'Conference Review':
               return  'Отзыв конференции'
            case 'Editorial':
                return  'Редакция'
            case 'Erratum':
                return  'Исправление'
            case 'Letter':
                return  'Письмо'
            case 'Note':
               return  'Заметка'
            case 'Press Release':
                return  'Пресс-релиз'
            case 'Review':
                return  'Отзыв'
            case 'Short Survey':
                return  'Краткий обзор'
        }
}


const getScopusDataList = async (query) => {
    let encode = `${query["search"]["type"]}(${query["search"]["field"]})`

    if(query["filter"]) {
        for (const [key, value] of Object.entries(query["filter"])) {
            if(value && Array.isArray(value)){
    
                encode += ` AND ${key}(${value[0]}`

                for(let i = 1; i < value.length; i++){
                    encode += ` OR ${value[i]}`
                } 
                encode += ')'
            }else if(value && typeof(value) === 'object'){
                let operator = '='
                if(value["operator"] === "greater") {
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
            if (body?.['service-error']){
                reject(`ERROR: ${body['service-error']['status']['statusText']}`);
                return
            }
            if(error){
                reject(`ERROR: ${error.code}`)
                return
            }
            data['currentPage'] = Number(body?.['search-results']?.['opensearch:startIndex']) + 1
            data['totalItems'] = Number(body?.['search-results']?.['opensearch:totalResults'])
            data['totalPages'] = Math.ceil(data['totalItems'] / limit);
            if(data['totalPages'] > 5000 - limit){
                data['totalPages'] = 5000 - limit
                data['totalItems'] = (5000 - limit) * limit
            }
            data['data'] = []
       
            for (const [key, value] of Object.entries(body?.['search-results']?.['entry'])) {
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
                items['subtypeDescription'] = subtypeTranslator(value['subtypeDescription'])
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
            if (body?.['service-error']){
                reject(`ERROR: ${body['service-error']['status'][' statusText']}`);
                return
            }

            if(error){
                reject(`ERROR: ${error.code}`)
                return
            }

            if (body?.['serial-metadata-response']?.['error']){
                reject(`ERROR: ${body['serial-metadata-response']['error']}`);
                return
            }


            let res = body["serial-metadata-response"]["entry"][0]

            data['title'] = res['dc:title']
            data['publisher'] = res['dc:publisher']
            data['coverageStartYear'] = res['coverageStartYear']
            data['coverageEndYear'] = res['coverageEndYear']
            data['aggregationType'] = typeTranslator(res['prism:aggregationType'])
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