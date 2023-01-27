import createTable from '../../database/createNewsTable.js';
import checkTable from '../../database/checkURL.js';
import changeNumMonth from '../constant/changeNumMonth.js';

const scraperObject = {
    url: 'https://komobr-eao.ru/category/news',
    async scraper(browser){
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url, {
            waitUntil: 'load',
            timeout: 0
        });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('.content-area');
		// Get the link to all the required books
		let urls = await page.$$eval('.content-area > article .entry-title', links => {
			links = links.map(el => el.querySelector('a').href)
			return links;
		});

		let pagePromise = (link) => new Promise(async(resolve, reject) => {
			let dataObj = {};
			let newPage = await browser.newPage();
			await newPage.goto(link, {
				waitUntil: 'load',
				timeout: 0
			});

			dataObj['newsTittle'] = await newPage.$eval('#primary article .entry-title', text => text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim());
			
			dataObj['newsDate'] = await newPage.$eval('#primary article .entry-date', text => text.textContent);
            dataObj['newsDate'] = changeNumMonth.changeMonth(dataObj['newsDate']);

            dataObj['imageUrl'] = await newPage.$$eval('#primary article .entry-content :not(.content-thumbnail) a:has(img)', img => {
                img = img.map(el => el.href);
                return img
            });

            if(dataObj['imageUrl'].length === 0){
                dataObj['imageUrl'] = await newPage.$$eval('#primary article .entry-content .content-thumbnail a', img => {
                    img = img.map(el => el.href);
                    return img
                });
            }
         
			dataObj['newsDesc'] = await newPage.$$eval('#primary article .entry-content > p', div => {
				div = div.map(el => el.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim());
				return div;  
			});

            if(dataObj['newsDesc'].length === 0){
                dataObj['newsDesc'] = await newPage.$eval('#primary article .entry-content', div => [ div.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim() ]);
            }

			dataObj['url'] = link;
			resolve(dataObj);
			await newPage.close();
		});

		let scrapedData = [];
		let check = {};

		urls = urls.reverse();
		for(let link in urls){
			await checkTable.checkTable(urls[link], 'news_evr_aob_mno').then((res) =>{
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
			createTable(scrapedData, 'news_evr_aob_mno');
		}    
		await page.close();	
    }
}


export default { scraperObject }; 