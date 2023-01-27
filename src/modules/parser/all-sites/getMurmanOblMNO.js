import createTable from '../../database/createNewsTable.js';
import checkTable from '../../database/checkURL.js';

const scraperObject = {
    url: 'https://minobr.gov-murman.ru/press/news/',
    async scraper(browser){
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url, {
            waitUntil: 'load',
            timeout: 0
        });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('.b1t-soir-news-news-news');
		// Get the link to all the required books
		let urls = await page.$$eval('.b1t-soir-news-news-news .list-wrapper .items > div', links => {
			links = links.map(el => el.querySelector('.picture-wrapper').href)
			return links;
		});

		let pagePromise = (link) => new Promise(async(resolve, reject) => {
			let dataObj = {};
			let newPage = await browser.newPage();
			await newPage.goto(link, {
				waitUntil: 'load',
				timeout: 0
			});

			dataObj['newsTittle'] = await newPage.$eval('.inner-wrapper .display-table .title h1', text => text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim());
			
			dataObj['newsDate'] = await newPage.$$eval('.b1t-soir-news-detail-news .date', text => text[0].textContent);

            dataObj['imageUrl'] = await newPage.$$eval('.b1t-soir-news-detail-news .photos .photo', img => {
                img = img.map(el => "https://minobr.gov-murman.ru/" + el.dataset.src.replace(/(\/resize_cache)/gm, '').replace(/(\/190_110_2)/gm, ''));
                return img
            });

            dataObj['imageUrl'] = dataObj['imageUrl'].concat(await newPage.$$eval('.b1t-soir-news-detail-news .text img', img => {
                img = img.map(el => el.src);
                return img
            }));
         
			dataObj['newsDesc'] = await newPage.$$eval('.b1t-soir-news-detail-news .text > p', div => {
				div = div.map(el => el.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim());
				return div;
			});

            if(dataObj['newsDesc'].length === 0){
                dataObj['newsDesc'] = await newPage.$eval('.b1t-soir-news-detail-news .text', div => [ div.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim() ]);
            }

			dataObj['url'] = link;
			resolve(dataObj);
			await newPage.close();
		});

		let scrapedData = [];
		let check = {};

		urls = urls.reverse();
		for(let link in urls){
			await checkTable.checkTable(urls[link], 'news_murmanobl_mno').then((res) =>{
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
			createTable(scrapedData, 'news_murmanobl_mno');
		}    
		await page.close();	
    }
}


export default { scraperObject }; 