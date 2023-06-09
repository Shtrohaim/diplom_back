import updateData from '../../database/updateTable.js';

const scraperObject = {
    url: 'https://fipi.ru/ege',
    async scraper(browser){
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url, {
            waitUntil: 'load',
            timeout: 0
        });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('.t125');
		// Get the link to all the required books
		let urls = await page.$$eval('.t125 > .t-container .t125__title', links => {
			links = links.map(el => el.querySelector('a').href)
			return links;
		});
        
        urls = urls.filter(el => el !== 'https://fipi.ru/ege/videokonsultatsii-razrabotchikov-kim-yege' && el !== 'https://fipi.ru/ege/normativno-pravovye-dokumenty' && el !== 'https://fipi.ru/ege');
        
        let description = await page.$eval('.t469 > .t-container > div > .t-descr', html => html.innerHTML.replace(/(<br><a)/gm, " <a"))

		let pagePromise = (link) => new Promise(async(resolve, reject) => {
			let dataObj = {};
            let dataSubject = {};

			let newPage = await browser.newPage();
			await newPage.goto(link, {
                waitUntil: 'load',
                timeout: 0
            });

			dataObj['pageTitle'] = await newPage.$eval('.t469 .t469__title', text => text.textContent.replace(/(\r\n\t|\r|\t)/gm, "").replace(/(КИМ)/gm, " КИМ").trim());
			
            dataObj['pageDescription'] = await newPage.$$eval('.t004', text => {
                if (text.length !== 0)
                    text = text[0].textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim()
                else
                    text = ""

                return text
            });

            let subjectsName = await newPage.$$eval('.t817__wrapper .t817__tab button', text => {
                text = text.map(el => el.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim())
                return text
            });
            
            let subjectsDocument = await newPage.$$eval('.t817__content-row .t817__content', cards => {
                cards = cards.map(el => {
                    let links = {}
                    for(let i = 0; i < el.querySelectorAll('a').length; i++){
                        links[`${el.querySelectorAll('a')[i].textContent}`] = el.querySelectorAll('a')[i].href
                    }
                    return links
                })
                return cards
            });

            for(let i = 0; i < subjectsName.length; i++){
                dataSubject[subjectsName[i]] = subjectsDocument[i]
            }

            dataObj['info'] = dataSubject 
			dataObj['url'] = link;
			resolve(dataObj);
			await newPage.close();
		});
        

		let scrapedData = [];

        scrapedData.push( { 'pageTitle': 'ЕГЭ', 'pageDescription' : description, 'url': 'https://fipi.ru/ege'} )

        let newPage = await browser.newPage();
        await newPage.goto('https://fipi.ru/ege/normativno-pravovye-dokumenty', {
            waitUntil: 'load',
            timeout: 0
        });

        scrapedData.push( { 'pageTitle': await newPage.$eval('.t469__title', text => text.textContent), 'pageDescription' : await newPage.$eval('.t469 > .t-container > div > .t-descr', html => html.innerHTML.replace(/(<br><a)/gm, " <a")), 'url': 'https://fipi.ru/ege/normativno-pravovye-dokumenty'} )

        await newPage.close();

		for(let link in urls){
            let currentPageData = await pagePromise(urls[link]);
            scrapedData.push(currentPageData)
		}
		if(scrapedData.length !== 0){
			updateData(scrapedData, 'fipi_ege');
		}    
		await page.close();	
    }
}


export default { scraperObject }; 