import createTable from '../../database/createNewsTable.js';
import checkTable from '../../database/checkURL.js';
import changeShortStrMonth from '../constant/changeShortStrMonth.js';

const scraperObject = {
    url: 'https://mon95.ru/press-center/news/sobytiya-nedeli',
    async scraper(browser){
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url, {
            waitUntil: 'load',
            timeout: 0
        });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('.wis-basic_education-docs-block');
		// Get the link to all the required books
		let urls = await page.$$eval('.wis-basic_education-docs-block .wis-certification-documents-box', links => {
			links = links.map(el => el.querySelector('.wis-certification-documents-box-text a').href)
			return links;
		});


		let pagePromise = (link) => new Promise(async(resolve, reject) => {
			let dataObj = {};
			let newPage = await browser.newPage();
			await newPage.goto(link, {
				waitUntil: 'load',
				timeout: 0
			});

			dataObj['newsTittle'] = await newPage.$eval('.wis-common-title h1', text => text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim());
			dataObj['newsDate'] = await newPage.$eval('.wis-certification-documents-box-item .wis-common-date', text => text.textContent);
            dataObj['newsDate'] = changeShortStrMonth.changeMonth(dataObj['newsDate']);

	        dataObj['imageUrl'] = await newPage.$$eval('.wis-universal-block-aside_right .wis-universal-block-img img', img => {
                img = img.map(el => el.src);
                return img
            });

			dataObj['newsDesc'] = await newPage.$$eval('.wis-universal-block-text p', div => {
				div = div.map(el => el.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim());
				return div;
			});

			dataObj['url'] = link;
			resolve(dataObj);
			await newPage.close();
		});

		let scrapedData = [];
		let check = {};

		urls = urls.reverse();
		for(let link in urls){
			await checkTable.checkTable(urls[link], 'news_chech_mno').then((res) =>{
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
			createTable(scrapedData, 'news_chech_mno');
		}    
		await page.close();	
    }
}


export default { scraperObject }; 