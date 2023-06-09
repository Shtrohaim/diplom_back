import createTable from '../../database/createNewsTable.js';
import checkTable from '../../database/checkURL.js';

const scraperObject = {
    url: 'https://minobr.khabkrai.ru/events/Novosti/',
    async scraper(browser){
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url, {
            waitUntil: 'load',
            timeout: 0
        });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('.news-list-wrapper');
		// Get the link to all the required books
		let urls = await page.$$eval('.news-list-wrapper .news-list-inner-wrapper .news-row', links => {
			links = links.map(el => el.querySelector('.news-photo').href)
			return links;
		});


		let pagePromise = (link) => new Promise(async(resolve, reject) => {
			let dataObj = {};
			let newPage = await browser.newPage();
			await newPage.goto(link, {
                waitUntil: 'load',
                timeout: 0
            });
			dataObj['newsTittle'] = await newPage.$eval('.material_page_wrapper h1', text => text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim());
			dataObj['newsDate'] = await newPage.$eval('.material_page_wrapper .material-system-data .material-date', text => text.textContent);

	        dataObj['imageUrl'] = await newPage.$$eval('.material_page_wrapper .photo_smallphotos a', img => {
                img = img.map(el => el.href);
                return img
            });

			dataObj['newsDesc'] = await newPage.$$eval('.material_page_wrapper .doubleblock p', div => {
				div = div.map(el => el.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim())
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
			await checkTable.checkTable(urls[link], 'news_habarkray_mno').then((res) =>{
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
			createTable(scrapedData, 'news_habarkray_mno');
		}    
		await page.close();	
    }
}


export default { scraperObject }; 