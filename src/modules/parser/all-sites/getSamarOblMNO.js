import createTable from '../../database/createNewsTable.js';
import checkTable from '../../database/checkURL.js';

const MONTHS = {
    'янв':'Января',
    'фев':'Февраля',
    'март':'Марта',
    'апр':'Апреля',
    'мая':'Мая',
    'июнь':'Июня',
    'июль':'Июля',
    'авг':'Августа',
    'сен':'Сентября',
    'окт':'Октября',
    'нояб':'Ноября',
    'дек':'Декабря' }

const scraperObject = {
    url: 'https://sumoin.ru/index.php/deyatelnost/novosti',
    async scraper(browser){
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url, {
            waitUntil: 'load',
            timeout: 0
        });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('.catItemList');
		// Get the link to all the required books
		let urls = await page.$$eval('.catItemList .catItemView', links => {
			links = links.map(el => el.querySelector('h3 a').href)
			return links;
		});

		let pagePromise = (link) => new Promise(async(resolve, reject) => {
			let dataObj = {};
			let newPage = await browser.newPage();
			await newPage.goto(link, {
				waitUntil: 'load',
				timeout: 0
			});

			dataObj['newsTittle'] = await newPage.$eval('.itemBody .page-header h2', text => text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim());
			
			dataObj['newsDate'] = await newPage.$eval('.article-info .itemDateCreated', text => text.textContent.split(', ')[1])
            let dateSplit = dataObj['newsDate'].split(' ');
            dataObj['newsDate'] = dateSplit[1] + " " + MONTHS[dateSplit[0]] + " " + dateSplit[2];

            dataObj['imageUrl'] = await newPage.$$eval('.itemImage a', img => {
                img = img.map(el => el.href);
                return img
            });
         
			dataObj['newsDesc'] = await newPage.$$eval('.itemFullText > p, .itemFullText li', div => {
				div = div.map(el => el.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim());
				return div;  
			});

            if(dataObj['newsDesc'].length === 0){
                dataObj['newsDesc'] = await newPage.$eval('.itemFullText', div => [ div.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim() ]);
            }

			dataObj['url'] = link;
			resolve(dataObj);
			await newPage.close();
		});

		let scrapedData = [];
		let check = {};

		urls = urls.reverse();
		for(let link in urls){
			await checkTable.checkTable(urls[link], 'news_samarobl_mno').then((res) =>{
				check[urls[link]] = res
			}).catch((err) => {
				console.log("Promise checkTable error: " + err);
			})

			if(check[urls[link]]){
				let currentPageData = await pagePromise(urls[link]);
				scrapedData.push(currentPageData)
			}
		
		}
		if(scrapedData.length !== 0){
			createTable(scrapedData, 'news_samarobl_mno');
		}    
		await page.close();	
    }
}


export default { scraperObject }; 