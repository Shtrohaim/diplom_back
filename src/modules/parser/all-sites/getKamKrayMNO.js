import createTable from '../../database/createNewsTable.js';
import checkTable from '../../database/checkURL.js';

const scraperObject = {
    url: 'https://www.kamgov.ru/minobraz/news',
    async scraper(browser){
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url, {
            waitUntil: 'load',
            timeout: 0
        });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('.content .news');
		// Get the link to all the required books
		let urls = await page.$$eval('.content .news .item', links => {
			links = links.map(el => el.querySelector('.title a').href)
			return links;
		});


		let pagePromise = (link) => new Promise(async(resolve, reject) => {
			let dataObj = {};
			let newPage = await browser.newPage();
			await newPage.goto(link, {
				waitUntil: 'load',
				timeout: 0
			});

			dataObj['newsTittle'] = await newPage.$eval('.news_item h1', text => text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim());
            dataObj['newsDate'] = await newPage.$eval('.news_item .date', text => text.textContent);

	        dataObj['imageUrl'] = await newPage.$$eval('.gallery .popup-thumbs', img => {
                img = img.map(el => el.href);
                return img
            });

			dataObj['newsDesc'] = await newPage.$$eval('.content .text p:not(.date)', div => {
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
			await checkTable.checkTable(urls[link], 'news_kamkray_mno').then((res) =>{
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
			createTable(scrapedData, 'news_kamkray_mno');
		}    
		await page.close();	
    }
}


export default { scraperObject }; 