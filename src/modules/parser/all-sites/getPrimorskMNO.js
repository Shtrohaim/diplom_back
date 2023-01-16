import createTable from '../../database/createNewsTable.js';
import checkTable from '../../database/checkURL.js';

const scraperObject = {
    url: 'https://edu.primorsky.ru/news/',
    async scraper(browser){
        let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		await page.goto(this.url, {
            waitUntil: 'load',
            timeout: 0
        });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('.content-block > .slider > .content');
		// Get the link to all the required books
		let urls = await page.$$eval('.content-block .slider .content .slide .list-item', links => {
			links = links.map(el => el.href)
			return links;
		});

        let dates = await page.$$eval('.content-block .slider .content .slide .date', links => {
			links = links.map(el => el.textContent)
			return links;
		});


		let pagePromise = (link, date) => new Promise(async(resolve, reject) => {
			let dataObj = {};
			let newPage = await browser.newPage();
			await newPage.goto(link, {
                waitUntil: 'load',
                timeout: 0
            });
			dataObj['newsTittle'] = await newPage.$eval('.page-title .title', text => text.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim());
			dataObj['newsDate'] = date;

	        dataObj['imageUrl'] = await newPage.$$eval('.page-content > div:nth-child(2) > div:nth-child(1) .content-block img', img => {
                img = img.map(el => el.src);
                return img
            });

			dataObj['newsDesc'] = await newPage.$$eval('.content-block p', div => {
				div = div.map(el => el.textContent.replace(/(\r\t|\r|\t)/gm, "").replace(/(\n)/gm, "<br>").trim())
				return div;
			});

            if(dataObj['newsDesc'].length === 0){
                dataObj['newsDesc'] = await newPage.$eval('.content-block', div => div.textContent.replace(/(\n)/gm, "<br>").trim());
            }

			dataObj['url'] = link;
			resolve(dataObj);
			await newPage.close();
		});

		let scrapedData = [];
		let check = {};

		urls = urls.reverse();
        dates = dates.reverse();

		for(let link in urls){
			await checkTable.checkTable(urls[link], 'news_primorsk_mno').then((res) =>{
				check[urls[link]] = res
			}).catch((err) => {
				console.log("Promise checkTable error: " + err);
			})

			if(check[urls[link]]){
				let currentPageData = await pagePromise(urls[link], dates[link]);
				scrapedData.push(currentPageData)
			}
		
		}
		if(scrapedData.length !== 0){
			createTable(scrapedData, 'news_primorsk_mno');
		}    
		await page.close();	
    }
}


export default { scraperObject }; 