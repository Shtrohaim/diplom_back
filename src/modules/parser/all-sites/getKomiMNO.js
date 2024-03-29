import createTable from '../../database/createNewsTable.js';
import checkTable from '../../database/checkURL.js';

const scraperObject = {
    url: 'https://minobr.rkomi.ru/news/category/1',
    async scraper(browser){
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url, {
            waitUntil: 'load',
            timeout: 0
        });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('.layout__all-news');
		// Get the link to all the required books
		let urls = await page.$$eval('.layout__all-news .container .row .items-list .item', links => {
			links = links.map(el => el.querySelector('.title').href)
			return links;
		});


		let pagePromise = (link) => new Promise(async(resolve, reject) => {
			let dataObj = {};
			let newPage = await browser.newPage();
			await newPage.goto(link, {
                waitUntil: 'load',
                timeout: 0
            });
			dataObj['newsTittle'] = await newPage.$eval('.layout__page-header .container .info .title', text => text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim());
			dataObj['newsDate'] = await newPage.$eval('#rightSide .block .info', text => text.textContent);

	        dataObj['imageUrl'] = await newPage.$$eval('#leftSide > div img', img => {
                img = img.map(el => el.src);
                return img
            });

	        dataObj['imageUrl'].push(await newPage.$eval('#leftSide > a', img => img.href));

			dataObj['newsDesc'] = await newPage.$$eval('#leftSide > div p, #leftSide > div li', div => {
				div = div.map(el => el.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim())
				return div;
			});

            if(dataObj['newsDesc'].length === 0){
                dataObj['newsDesc'] = await newPage.$eval('#leftSide > div', div => [ div.textContent.replace(/((\d\d)\.(\d\d)\.(\d\d\d\d))|(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim() ]);
            }
            
			dataObj['url'] = link;
			resolve(dataObj);
			await newPage.close();
		});

		let scrapedData = [];
		let check = {};

		urls = urls.reverse();

		for(let link in urls){
			await checkTable.checkTable(urls[link], 'news_komi_mno').then((res) =>{
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
			createTable(scrapedData, 'news_komi_mno');
		}    
		await page.close();	
    }
}


export default { scraperObject }; 